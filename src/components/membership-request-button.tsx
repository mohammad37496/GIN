"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft,CheckCircle2 } from "lucide-react";

export default function MembershipRequestButton({planId,authenticated,disabled,alreadyRequested,hasActiveMembership=false}:{planId:number;authenticated:boolean;disabled:boolean;alreadyRequested:boolean;hasActiveMembership?:boolean}){
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const router=useRouter();
  if(alreadyRequested)return <span className="course-enrolled"><CheckCircle2 size={16}/> درخواست ثبت شده</span>;
  async function request(){if(!authenticated){router.push("/login?next=%2Fmembership");return;}setBusy(true);setMessage("");try{const response=await fetch(hasActiveMembership?"/api/membership/change":"/api/membership/requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({planId})});const data=await response.json();if(!response.ok)throw new Error(data.error||"درخواست ثبت نشد.");setMessage(data.message);router.refresh();}catch(error){setMessage(error instanceof Error?error.message:"خطا در ثبت درخواست");}finally{setBusy(false);}}
  return <div className="membership-request-action"><button className="button button-small" onClick={request} disabled={busy||disabled}>{busy?"در حال ثبت...":hasActiveMembership?"تغییر به این سطح":"درخواست این سطح"}<ArrowLeft size={15}/></button>{message&&<small>{message}</small>}</div>;
}
