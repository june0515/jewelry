const materials = ['925银','18K金','14K金','铂金','珍珠','钻石','天然石','合金','玫瑰金','其他'];

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values, allowed) {
  if (!Array.isArray(values)) return [];
  return values
    .filter(value => typeof value === 'string')
    .map(value => value.trim())
    .filter(Boolean)
    .filter(value => !allowed || allowed.includes(value));
}

function sendError(res, status, error) {
  res.status(status).json({ error });
}

function getApiKey() {
  const rawKey = process.env.OPENAI_API_KEY;
  if (!rawKey) return '';

  const compactKey = rawKey
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\s\u200B-\u200D\uFEFF]+/g, '');
  const keyMatch = compactKey.match(/sk-(?:proj|svcacct|admin)?-?[A-Za-z0-9_-]{20,}/);
  return keyMatch ? keyMatch[0] : compactKey;
}

function describeKey(rawKey, apiKey) {
  const cleaned = apiKey || '';
  const preview = cleaned ? `${cleaned.slice(0, 8)}...${cleaned.slice(-4)}` : '(empty)';
  return `当前 Vercel 读取到的 OPENAI_API_KEY 长度=${cleaned.length}，开头/结尾=${preview}。请确认变量名必须是 OPENAI_API_KEY，并且修改后重新 Deploy。`;
}

function getEnrichmentModelName() {
  return (process.env.OPENAI_ENRICH_MODEL || process.env.OPENAI_MODEL || 'gpt-5.4-mini').trim();
}

function asNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      sendError(res, 405, '只支持 POST 请求');
      return;
    }

    const rawKey = process.env.OPENAI_API_KEY;
    const apiKey = getApiKey();
    if (!apiKey) {
      sendError(res, 500, '缺少 OPENAI_API_KEY，请先在 Vercel 的 Environment Variables 添加到 Production');
      return;
    }

    if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(apiKey)) {
      sendError(res, 500, `OPENAI_API_KEY 格式不正确。${describeKey(rawKey, apiKey)}`);
      return;
    }

    const body = req.body || {};
    const image = typeof body.image === 'string' && body.image.startsWith('data:image/') ? body.image : '';
    const hints = {
      name: readText(body.name),
      brand: readText(body.brand),
      series: readText(body.series),
      category: readText(body.category),
      materials: Array.isArray(body.materials) ? body.materials.map(readText).filter(Boolean) : [],
      mainStone: readText(body.mainStone),
      metalColor: readText(body.metalColor),
    };

    if (!image && !hints.name && !hints.brand && !hints.series) {
      sendError(res, 400, '请先上传图片，或至少填写名称/品牌/系列后再搜索官网资料');
      return;
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getEnrichmentModelName(),
        tools: [{
          type: 'web_search',
          search_context_size: 'low',
          search_content_types: ['image', 'text'],
          image_settings: {
            max_results: 3,
            caption: true,
          },
        }],
        include: ['web_search_call.results'],
        input: [{
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: [
                'Find the most likely official brand product page for this jewelry or watch item, then extract its official material/composition description.',
                'Use the uploaded image and the provided hints to identify the style, collection, product name, or reference. Prefer official brand websites only.',
                'Do not invent a product, price, URL, image, brand, material, or series.',
                'If you cannot verify the item on an official page, return empty strings and matchConfidence "low".',
                'Return current official retail price only if it is visible on the official product page.',
                'Return an official product image URL only if it comes from the official product page or official search result image.',
                'For materialDescription, quote or closely summarize the official page material/composition wording, including metal, stone, pearl, dial, strap, or coating when visible.',
                `Allowed materials: ${materials.join(', ')}`,
                `Hints: ${JSON.stringify(hints)}`,
              ].join('\n'),
            },
            ...(image ? [{ type: 'input_image', image_url: image, detail: 'high' }] : []),
          ],
        }],
        text: {
          format: {
            type: 'json_schema',
            name: 'official_jewelry_enrichment',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                productName: { type: 'string' },
                brand: { type: 'string' },
                series: { type: 'string' },
                productUrl: { type: 'string' },
                imageUrl: { type: 'string' },
                priceText: { type: 'string' },
                priceAmount: { type: 'number' },
                currency: { type: 'string' },
                materialDescription: { type: 'string' },
                materials: { type: 'array', items: { type: 'string', enum: materials } },
                sourceTitle: { type: 'string' },
                matchConfidence: { type: 'string', enum: ['high','medium','low'] },
                fetchedAt: { type: 'string' },
              },
              required: ['productName','brand','series','productUrl','imageUrl','priceText','priceAmount','currency','materialDescription','materials','sourceTitle','matchConfidence','fetchedAt'],
            },
          },
        },
      }),
    });

    const responseText = await openaiResponse.text();
    let payload = null;
    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch {
      payload = null;
    }

    if (!openaiResponse.ok) {
      const message = (payload && payload.error && payload.error.message) || responseText || '官网资料搜索暂时不可用';
      const modelHint = /model|does not exist|not found|invalid|tool/i.test(message)
        ? '。如果当前模型不支持官网搜索，请在 Vercel 设置 OPENAI_ENRICH_MODEL=gpt-5.4-mini'
        : '';
      sendError(res, openaiResponse.status, `${message}${modelHint}`);
      return;
    }

    let parsed = {};
    try {
      parsed = JSON.parse((payload && payload.output_text) || '{}');
    } catch {
      sendError(res, 502, '官网资料返回内容无法解析，请再试一次');
      return;
    }

    res.status(200).json({
      productName: readText(parsed.productName),
      brand: readText(parsed.brand),
      series: readText(parsed.series),
      productUrl: readText(parsed.productUrl),
      imageUrl: readText(parsed.imageUrl),
      priceText: readText(parsed.priceText),
      priceAmount: asNumber(parsed.priceAmount),
      currency: readText(parsed.currency),
      materialDescription: readText(parsed.materialDescription),
      materials: cleanList(parsed.materials, materials),
      sourceTitle: readText(parsed.sourceTitle),
      matchConfidence: ['high','medium','low'].includes(parsed.matchConfidence) ? parsed.matchConfidence : 'low',
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Official jewelry enrichment failed:', error);
    sendError(res, 502, error && error.message ? `官网资料搜索失败：${error.message}` : '官网资料搜索暂时不可用');
  }
};
