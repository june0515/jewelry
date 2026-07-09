import { compressImage } from '../utils/imageCompression';
import { useI18n } from '../i18n';
export function ImageUploader({photos,onChange}:{photos:string[];onChange:(v:string[])=>void}){
  const {t}=useI18n();
  async function handle(files: FileList | null){
    if(!files) return;
    const results = await Promise.allSettled(Array.from(files).map(f=>compressImage(f)));
    const imgs = results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map(result => result.value);
    const failed = results.find(result => result.status === 'rejected') as PromiseRejectedResult | undefined;
    if (imgs.length) onChange([...photos, ...imgs]);
    if (failed) alert(failed.reason instanceof Error ? failed.reason.message : t('photoUploadFailed'));
  }
  return <div><label className="upload" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); handle(e.dataTransfer.files);}}><input type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple onClick={e=>{(e.currentTarget as HTMLInputElement).value='';}} onChange={e=>handle(e.target.files)}/><strong>{t('uploadPhotos')}</strong><span>{t('uploadHint')}</span></label><div className="thumbs">{photos.map((p,i)=><button type="button" key={i} onClick={()=>onChange(photos.filter((_,idx)=>idx!==i))}><img src={p}/>{i===0 && <em>{t('cover')}</em>}<span>×</span></button>)}</div></div>
}
