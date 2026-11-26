"use client";

import { useEffect,useState } from "react";
import { Download,FileText } from "lucide-react";

type Resource={id:number;title:string;contentType:string;sizeBytes:number;isDownloadable:boolean;url:string};
export default function LessonResources({lessonId}:{lessonId:number}){const [resources,setResources]=useState<Resource[]>([]);const [message,setMessage]=useState("");useEffect(()=>{let active=true;fetch(`/api/lessons/${lessonId}/resources`,{cache:"no-store"}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);if(active)setResources(data.resources);}).catch(error=>{if(active)setMessage(error instanceof Error?error.message:"دریافت فایل‌های آموزشی ممکن نشد.");});return()=>{active=false;};},[lessonId]);if(!resources.length&&!message)return null;return <section className="lesson-resources"><h2>فایل‌های تکمیلی درس</h2>{message&&<p>{message}</p>}{resources.map(resource=><a key={resource.id} href={resource.url} target="_blank" rel="noreferrer"><FileText size={17}/><span>{resource.title}<small>{Math.ceil(resource.sizeBytes/1024)} کیلوبایت</small></span><Download size={15}/></a>)}</section>}
