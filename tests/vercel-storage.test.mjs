import test from 'node:test';
import assert from 'node:assert/strict';
import { neon } from '@neondatabase/serverless';
import { initialize, postgresAdapter, bucket, handle } from '../.vercel/output/functions/api.func/index.mjs';
import worker from '../dist/server/index.js';

test('Vercel adapter rejects anonymous and cross-origin access', async () => {
  const response = await handle(new Request('https://portal.test/api/project', {headers:{'oai-authenticated-user-id':'spoofed'}}));
  assert.equal(response.status,401);
  const foreign = await handle(new Request('https://portal.test/api/project', {method:'POST',headers:{origin:'https://foreign.test'},body:'{}'}));
  assert.equal(foreign.status,403);
});

test('Neon persistence and private Blob round trip', {skip:process.env.RUN_VERCEL_INTEGRATION!=='1'}, async () => {
  const owner=`integration-test-${crypto.randomUUID()}`;
  const env={DB:postgresAdapter,BUCKET:bucket,ASSETS:{fetch:async()=>new Response('not found',{status:404})}};
  const sql=neon(process.env.DATABASE_URL);
  let key;
  const request=(path,method='GET',body,identity=owner)=>new Request(`https://portal.test${path}`,{method,headers:{origin:'https://portal.test','oai-authenticated-user-id':identity,...(body instanceof FormData?{}:{'content-type':'application/json'})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});
  await initialize();
  try {
    const id=crypto.randomUUID();
    const saved=await worker.fetch(request('/api/project','POST',{type:'feedback-add',id,target:'hero-heading',text:'Storage integration verification',x:20,y:30}),env);
    assert.equal(saved.status,200);
    const reread=await (await worker.fetch(request('/api/project'),env)).json();
    assert.equal(reread.feedback.filter(item=>item.id===id).length,1);
    const form=new FormData();
    form.set('file',new File(['Tigotek private storage verification'],'verification.txt',{type:'text/plain'}));
    form.set('category','Brand');
    const uploaded=await worker.fetch(request('/api/assets','POST',form),env);
    assert.equal(uploaded.status,200);
    const asset=(await uploaded.json()).assets[0];
    key=`${encodeURIComponent(owner)}/${asset.id}`;
    const download=await worker.fetch(request(`/api/assets/${asset.id}`),env);
    assert.equal(download.status,200);
    assert.equal(await download.text(),'Tigotek private storage verification');
    const denied=await worker.fetch(request(`/api/assets/${asset.id}`,'GET',undefined,`${owner}-other`),env);
    assert.equal(denied.status,404);
  } finally {
    if(key)await bucket.delete(key);
    await sql.query('DELETE FROM portal_state WHERE owner=$1 OR owner=$2',[owner,`${owner}-other`]);
  }
});
