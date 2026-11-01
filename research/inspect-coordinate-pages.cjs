// Read-only public-page metadata inspection; never edits the app or accepts a guessed coordinate.
const {execFile}=require('node:child_process');
const urls=process.argv.slice(2);
async function inspect(url){
  if(!/^https:\/\//.test(url)) throw Error('HTTPS URLs only');
  const html=await new Promise(resolve=>execFile('curl',['-L','--fail','--max-time','20','-s',url],{maxBuffer:12*1024*1024},(error,stdout)=>resolve(error?'':stdout)));
  const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const patterns=[/[^<>\n]{0,50}(?:latitude|longitude|["']lat["']\s*:|["']lng["']\s*:|Degree形式)[^<>\n]{0,180}/gi,/(?:href|src)=["']([^"']*(?:maps\.google|google\.[^/]+\/maps|maps\.gsi|mapion\.co|maps\.app|goo\.gl\/maps)[^"']*)["']/gi];
  patterns.push(/[^<>\n]{0,40}(?:3[4567]\.\d{4,}|13[679]\.\d{4,}|140\.\d{4,})[^<>\n]{0,80}/g);
  const matches=[...new Set(patterns.flatMap(pattern=>[...html.matchAll(pattern)].map(m=>m[1]&&m[0].startsWith('href=')?m[1]:m[0])))].slice(0,30);
  const safeMatches=matches.map(value=>value.replace(/([?&](?:amp;)?key=)[^&"'<>\s]+/gi,'$1[public-browser-key-redacted]').replace(/AIza[0-9A-Za-z_-]{20,}/g,'[public-browser-key-redacted]'));
  console.log(JSON.stringify({url,title,bytes:html.length,matches:safeMatches},null,2));
}
(async()=>{for(let i=0;i<urls.length;i+=4)await Promise.all(urls.slice(i,i+4).map(inspect));})();
