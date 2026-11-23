import json,urllib.request,sys,itertools
B='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
def get(code,q):
    u=B+code+'?format=JSON&lang=EN&'+q
    r=urllib.request.urlopen(u,timeout=60).read()
    return json.loads(r)
def parse(j):
    ids=j['id'];size=j['size'];dim=j['dimension']
    cats=[]
    for d in ids:
        idx=dim[d]['category']['index']
        if isinstance(idx,list): idx={k:i for i,k in enumerate(idx)}
        lab=dim[d]['category'].get('label',{})
        cats.append(sorted(idx,key=idx.get))
    out=[]
    vals=j['value']; st=j.get('status',{})
    for flat,v in (vals.items() if isinstance(vals,dict) else enumerate(vals)):
        if v is None: continue
        flat=int(flat);pos=[]
        for s in reversed(size):
            pos.append(flat%s);flat//=s
        pos=pos[::-1]
        out.append({d:cats[i][p] for i,(d,p) in enumerate(zip(ids,pos))}|{'v':v})
    return ids,out,j.get('label','')
if __name__=='__main__':
    code,q=sys.argv[1],sys.argv[2]
    ids,out,l=parse(get(code,q));print(code,l,ids,len(out),out[:2])
