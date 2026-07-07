const categories = ['项链','耳环','戒指','手链','手表','胸针','脚链','其他'];
const materials = ['925银','18K金','14K金','铂金','珍珠','钻石','天然石','合金','玫瑰金','其他'];
const occasions = ['日常','通勤','正式','约会','派对','旅行'];
const statuses = ['常戴','收藏','需保养','已遗失','想转卖'];
const stones = ['钻石','珍珠','Mother of Pearl','玛瑙','翡翠','红宝石','蓝宝石','祖母绿','水晶','无主石','其他'];
const metalColors = ['Yellow Gold','Rose Gold','White Gold','Silver','Platinum','Black','Two-tone','其他'];

function cleanList(values, allowed) {
  if (!Array.isArray(values)) return [];
  return values
    .filter(value => typeof value === 'string')
    .map(value => value.trim())
    .filter(Boolean)
    .filter(value => !allowed || allowed.includes(value));
}

function pick(value, allowed, fallback) {
  return typeof value === 'string' && allowed.includes(value) ? value : fallback;
}

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function compactName(parsed) {
  const name = readText(parsed.name);
  if (name) return name;

  const metalColor = readText(parsed.metalColor);
  const category = readText(parsed.category);
  const mainStone = readText(parsed.mainStone);
  return [metalColor, mainStone && mainStone !== '无主石' ? mainStone : '', category || '首饰']
    .filter(Boolean)
    .join(' ');
}

function sendError(res, status, error) {
  res.status(status).json({ error });
}

function getModelName() {
  const model = (process.env.OPENAI_MODEL || 'gpt-5.4-nano').trim();
  if (/gpt\s*-?\s*4\s+nano/i.test(model) || /gpt4\s*nano/i.test(model)) {
    return 'gpt-4.1-nano';
  }
  return model;
}

function getApiKey() {
  const rawKey = process.env.OPENAI_API_KEY;
  if (!rawKey) return '';

  const compactKey = rawKey.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
  const keyMatch = compactKey.match(/sk-[A-Za-z0-9_-]+/);
  return keyMatch ? keyMatch[0] : compactKey;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      sendError(res, 405, '只支持 POST 请求');
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      sendError(res, 500, '缺少 OPENAI_API_KEY，请先在 Vercel 的 Environment Variables 添加到 Production');
      return;
    }

    if (!/^sk-[A-Za-z0-9_-]+$/.test(apiKey)) {
      sendError(res, 500, 'OPENAI_API_KEY 格式不正确：请只粘贴 sk-proj- 开头的 key，或重新创建一个新的 API key');
      return;
    }

    const image = req.body && req.body.image;
    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      sendError(res, 400, '请上传一张首饰照片后再识别');
      return;
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getModelName(),
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: [
                  '识别这张首饰照片，给个人首饰管理 app 生成可编辑建议。',
                  `category 只能选：${categories.join('、')}`,
                  `materials 只能选：${materials.join('、')}`,
                  `mainStone 只能选：${stones.join('、')}`,
                  `metalColor 只能选：${metalColors.join('、')}`,
                  `occasions 只能选：${occasions.join('、')}`,
                  `status 只能选：${statuses.join('、')}`,
                  '重点观察：首饰类型、金属颜色、是否有吊坠/链条/耳针/戒圈、是否有珍珠/钻石/彩色宝石、整体风格和可见文字。',
                  'name 用可见信息生成一个自然名称，例如“金色吊坠项链”“珍珠耳环”“银色戒指”。',
                  '只有图片上能看出 logo、包装文字、品牌标识时才填写 brand 或 series；无法确认请留空，不要猜品牌。',
                  '不要猜测市场价格。note 用中文简短描述可见款式、形状、宝石、颜色或保养提醒。',
                ].join('\n'),
              },
              { type: 'input_image', image_url: image, detail: 'high' },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'jewelry_identification',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                brand: { type: 'string' },
                series: { type: 'string' },
                category: { type: 'string', enum: categories },
                materials: { type: 'array', items: { type: 'string', enum: materials } },
                mainStone: { type: 'string', enum: stones },
                metalColor: { type: 'string', enum: metalColors },
                colors: { type: 'array', items: { type: 'string' } },
                occasions: { type: 'array', items: { type: 'string', enum: occasions } },
                status: { type: 'string', enum: statuses },
                note: { type: 'string' },
              },
              required: ['name','brand','series','category','materials','mainStone','metalColor','colors','occasions','status','note'],
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
      const message = (payload && payload.error && payload.error.message) || responseText || 'AI 识别服务暂时不可用';
      const modelHint = /model|does not exist|not found|invalid/i.test(message)
        ? '。请在 Vercel 里把 OPENAI_MODEL 改成 gpt-5.4-nano 或 gpt-4.1-nano，不要写 gpt4 nano'
        : '';
      sendError(res, openaiResponse.status, `${message}${modelHint}`);
      return;
    }

    let parsed = {};
    try {
      parsed = JSON.parse((payload && payload.output_text) || '{}');
    } catch {
      sendError(res, 502, 'AI 返回内容无法解析，请再试一次');
      return;
    }

    res.status(200).json({
      name: compactName(parsed),
      brand: readText(parsed.brand),
      series: readText(parsed.series),
      category: pick(parsed.category, categories, '其他'),
      materials: cleanList(parsed.materials, materials),
      mainStone: pick(parsed.mainStone, stones, ''),
      metalColor: pick(parsed.metalColor, metalColors, ''),
      colors: cleanList(parsed.colors),
      occasions: cleanList(parsed.occasions, occasions),
      status: pick(parsed.status, statuses, '常戴'),
      note: readText(parsed.note),
    });
  } catch (error) {
    console.error('Jewelry recognition failed:', error);
    sendError(res, 502, error && error.message ? `AI 识别服务请求失败：${error.message}` : 'AI 识别服务暂时不可用');
  }
};
