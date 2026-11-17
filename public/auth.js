window.hubRequest=async function(path,options={}){
 const response=await fetch(path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json','X-Learning-Hub':'1',...(options.headers||{})}});
 let data;try{data=await response.json();}catch{throw new Error('Respons server tidak valid. Coba muat ulang.');}
 if(!response.ok)throw new Error(data.error||'Permintaan belum berhasil.');
 return data;
};
window.hubReady=(async()=>{
 const overlay=document.getElementById('auth-overlay');
 let config;
 try{
  config=await window.hubRequest('/api/auth/config');
  const response=await fetch('/api/me',{credentials:'same-origin'});
  if(response.ok){const me=await response.json();const catalog=await window.hubRequest('/api/catalog');overlay.remove();document.body.classList.remove('is-loading');return{...me,catalog,auth:config};}
  if(response.status!==401)throw new Error('Server belum dapat memuat akun. Silakan coba lagi.');
 }catch(error){overlay.innerHTML='<div class="auth-card"><img src="assets/spun-logo.png" alt="SPUN"/><h1>Belum dapat terhubung.</h1><p id="connection-error"></p><button id="retry-connection" class="btn btn-orange">Coba lagi</button></div>';document.getElementById('connection-error').textContent=error.message;document.getElementById('retry-connection').onclick=()=>location.reload();return new Promise(()=>{});}
 let registering=false;
 const render=()=>{
  overlay.innerHTML=`<div class="auth-card"><img src="assets/spun-logo.png" alt="SPUN"/><div class="modal-kicker">SPUN LEARNING HUB</div><h1>${registering?'Mulai perjalanan belajarmu.':'Selamat datang kembali.'}</h1><p>Belajar hari ini. Bertumbuh setiap hari.</p>${config.mode==='chatgpt'?'<a class="btn btn-orange auth-submit" href="/signin-with-chatgpt?return_to=%2F" target="_top">Masuk dengan ChatGPT →</a>':`<form id="auth-form">${registering?'<label>Nama lengkap<input name="name" autocomplete="name" required minlength="2" maxlength="80" placeholder="Nama lengkap" /></label>':''}<label>Email<input name="email" type="email" autocomplete="username" required maxlength="254" placeholder="nama@perusahaan.com" /></label><label>Password<input name="password" type="password" autocomplete="${registering?'new-password':'current-password'}" required ${registering?'minlength="12"':''} maxlength="128" placeholder="${registering?'Minimal 12 karakter':'Masukkan password'}" /></label><div id="auth-error" role="alert"></div><button class="btn btn-orange auth-submit" type="submit">${registering?'Buat akun':'Masuk'} →</button></form>${config.registration?`<button id="switch-auth" class="auth-switch">${registering?'Sudah punya akun? Masuk':'Belum punya akun? Daftar'}</button>`:'<p class="auth-small">Hubungi pengelola jika kamu belum memiliki akun.</p>'}`}<div class="auth-footer">Small steps. Big growth. <span>✦</span></div></div>`;
  document.getElementById('switch-auth')?.addEventListener('click',()=>{registering=!registering;render();});
  document.getElementById('auth-form')?.addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector('button'),error=document.getElementById('auth-error');button.disabled=true;error.textContent='';try{const fields=Object.fromEntries(new FormData(form));await window.hubRequest('/api/auth/'+(registering?'register':'login'),{method:'POST',body:JSON.stringify(fields)});location.reload();}catch(e){error.textContent=e.message;button.disabled=false;}});
 };
 render();return new Promise(()=>{});
})();
