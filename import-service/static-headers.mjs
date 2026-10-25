// Preview uses the same emitted static security policy as Cloudflare Pages.
export function parseStaticHeaders(source){
 const rules=[];let rule=null;
 for(const line of source.split(/\r?\n/)){
  if(!line.trim()||line.trimStart().startsWith('#'))continue;
  if(line.startsWith('/')){rule={path:line.trim(),headers:{}};rules.push(rule);continue;}
  const match=/^\s+([A-Za-z-]+):\s*(.*)$/.exec(line);
  if(match&&rule)rule.headers[match[1]]=match[2];
 }
 return rules;
}
export function staticHeadersFor(rules,path){return Object.assign({},...rules.filter(rule=>rule.path==='/*'||rule.path===path).map(rule=>rule.headers));}
