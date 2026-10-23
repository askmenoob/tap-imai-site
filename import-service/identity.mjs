import {createHash} from 'node:crypto';
import {createRemoteJWKSet,jwtVerify} from 'jose';

const fail=(status,message)=>Object.assign(new Error(message),{status});
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'),{timeoutDuration:5000});
export function gmailAddress(value){
  const email=typeof value==='string'?value.trim().toLowerCase():'';
  if(!/^[a-z0-9](?:[a-z0-9.]{0,62}[a-z0-9])?@gmail\.com$/.test(email)||email.includes('..'))throw fail(400,'Gunakan alamat Gmail utama seperti nama@gmail.com, tanpa +alias.');
  return email;
}
export function ownerKey(email){
  const primary=gmailAddress(email).split('@')[0].replaceAll('.','')+'@gmail.com';
  return createHash('sha256').update(primary).digest('base64url');
}
export function createGoogleIdentityAuth({clientId,keySet=googleKeys}){
  return async authorization=>{
    if(!clientId)throw fail(503,'Login Google belum dikonfigurasi.');
    if(typeof authorization!=='string'||authorization.length>12000||!/^Bearer [A-Za-z0-9._-]+$/.test(authorization))throw fail(401,'Log masuk dengan Google terlebih dahulu.');
    let payload;
    try{({payload}=await jwtVerify(authorization.slice(7),keySet,{audience:clientId,issuer:['https://accounts.google.com','accounts.google.com'],algorithms:['RS256'],requiredClaims:['sub','exp','iat'],maxTokenAge:'70m',clockTolerance:5}));}
    catch{throw fail(401,'Sesi Google tamat atau tidak sah. Log masuk semula.');}
    if(payload.email_verified!==true||typeof payload.email!=='string')throw fail(403,'Alamat e-mel Google belum disahkan.');
    return {sub:payload.sub,email:payload.email.toLowerCase(),expiresAt:payload.exp*1000};
  };
}
export function createGoogleUserAuth(options){
  const verify=createGoogleIdentityAuth(options);
  return async authorization=>{
    const actor=await verify(authorization);
    try{gmailAddress(actor.email);}catch{throw fail(403,'Gunakan akaun Google dengan alamat @gmail.com untuk menyunting halaman anda.');}
    return {...actor,role:'user'};
  };
}
