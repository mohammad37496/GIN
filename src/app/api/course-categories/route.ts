import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
export async function GET(){try{await ensureSchema();const result=await pool.query(`SELECT cc.id,cc.slug,cc.name,cc.description,COUNT(ccl.course_id)::int AS course_count
  FROM course_categories cc LEFT JOIN course_category_links ccl ON ccl.category_id=cc.id LEFT JOIN courses c ON c.id=ccl.course_id AND c.status='published'
  WHERE cc.is_active=TRUE GROUP BY cc.id ORDER BY cc.position,cc.name`);return jsonResponse({categories:result.rows});}catch{return errorResponse("دریافت دسته‌بندی‌ها انجام نشد.",503);}}
