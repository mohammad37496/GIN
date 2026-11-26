import { S3Client } from "@aws-sdk/client-s3";

export function getStorageConfig(){const {S3_ENDPOINT,S3_BUCKET,S3_ACCESS_KEY_ID,S3_SECRET_ACCESS_KEY}=process.env;if(!S3_ENDPOINT||!S3_BUCKET||!S3_ACCESS_KEY_ID||!S3_SECRET_ACCESS_KEY)return null;return {bucket:S3_BUCKET,client:new S3Client({region:process.env.S3_REGION||"default",endpoint:S3_ENDPOINT,forcePathStyle:true,credentials:{accessKeyId:S3_ACCESS_KEY_ID,secretAccessKey:S3_SECRET_ACCESS_KEY}})};}
