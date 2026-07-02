import { compressImage } from '../utils/imageCompression';
import { useI18n } from '../i18n';
export function ImageUploader({photos,onChange}:{photos:string[];onChange:(v:string[])=>void}){
  const {t}=useI18n();
  async function handle(files: FileList | null){
    if(!files) return;
    const imgs = await Promise.all(Array.from(files).map(f=>compressImage(f)));
    onChange([...photos, ...imgs]);
  }
  return <div><label className="upload"><input type="file" accept="image/*" multiple onChange={e=>handle(e.target.files)}/>{t('uploadPhotos')}</label><div className="thumbs">{photos.map((p,i)=><button type="button" key={i} onClick={()=>onChange(photos.filter((_,idx)=>idx!==i))}><img src={p}/><span>×</span></button>)}</div></div>
}
