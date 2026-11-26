"use client";

import { useState } from "react";
import { Save } from "lucide-react";

export default function ProfileForm({initial}:{initial:{display_name:string;email:string|null;phone:string|null;locale:"fa"|"en";timezone:string}}){
  const [form,setForm]=useState({displayName:initial.display_name,email:initial.email??"",phone:initial.phone??"",locale:initial.locale,timezone:initial.timezone});const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setMessage("");try{const response=await fetch("/api/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const data=await response.json();if(!response.ok)throw new Error(data.error);setMessage(data.message);}catch(error){setMessage(error instanceof Error?error.message:"ذخیره پروفایل انجام نشد.");}finally{setBusy(false);}}
  return <form className="profile-form" onSubmit={submit}><label>نام نمایشی<input value={form.displayName} onChange={(e)=>setForm({...form,displayName:e.target.value})} maxLength={120}/></label><label>ایمیل<input type="email" dir="ltr" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} maxLength={254}/></label><label>شماره تماس<input dir="ltr" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} maxLength={40}/></label><label>زبان رابط<select value={form.locale} onChange={(e)=>setForm({...form,locale:e.target.value as "fa"|"en"})}><option value="fa">فارسی</option><option value="en">English (آماده‌سازی زبان)</option></select></label><label>منطقه زمانی<input dir="ltr" value={form.timezone} onChange={(e)=>setForm({...form,timezone:e.target.value})} maxLength={80}/></label>{message&&<p className="inline-message">{message}</p>}<button className="button" disabled={busy}>{busy?"در حال ذخیره...":"ذخیره پروفایل"}<Save size={16}/></button></form>;
}
