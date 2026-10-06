// Runs before log migration. Customer-specific catalogs keep their own presets.
if(!localStorage.getItem('presetCatalogV540')&&!localStorage.getItem('customerSetupV535')){
 const previous=[["XLR8",150],["200",500],["300",800],["350",1000],["ECO / EVO",440],["RISE",375],["THRIVE",250],["Plunge 14'",1500],['Plunge 7\'9"',800],["750",2800],["1200",3000],["2000",5000],["3500",5500]].map(([n,g])=>({id:'p'+n,n:n.toUpperCase(),g}));
 if(localStorage.getItem('standardPoolsV52')!==null){
  const next=P.map(p=>{const old=previous.find(x=>x.id===p.id),updated=DEFAULT_P.find(x=>x.id===p.id);return old&&updated&&p.n===old.n&&p.g===old.g?{...p,...updated}:p});
  // Only genuinely new catalog entries are added; previously deleted IDs stay deleted.
  if(P.length)for(const p of DEFAULT_P)if(!previous.some(x=>x.id===p.id)&&!next.some(x=>x.id===p.id))next.push({...p});
  persist('standardPoolsV52',next);P=next;
 }
 localStorage.setItem('presetCatalogV540','1');
}
