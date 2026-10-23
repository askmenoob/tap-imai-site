export function googleLogin({clientId,container,onCredential,onError,prompt=false}){
  const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
  script.onload=()=>{
    window.google.accounts.id.initialize({client_id:clientId,callback:result=>onCredential(result.credential),auto_select:false});
    window.google.accounts.id.renderButton(container,{type:'standard',theme:'outline',size:'large',text:'signin_with',shape:'rectangular'});
    if(prompt)window.google.accounts.id.prompt();
  };
  script.onerror=()=>onError('Butang Google tidak dapat dimuatkan. Semak sambungan dan muat semula.');document.head.append(script);
}
