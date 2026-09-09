export function valid(value=null){return Object.freeze({valid:true,value,errors:Object.freeze([])})}
export function invalid(code,message,meta={}){return Object.freeze({valid:false,value:null,errors:Object.freeze([Object.freeze({code:String(code),message:String(message),meta:Object.freeze({...meta})})])})}

export function validateRequired(value,{label='Waarde'}={}){
 const empty=value==null||String(value).trim()==='';
 return empty?invalid('required',`${label} is verplicht`):valid(value);
}

export function validateNumber(value,{label='Waarde',min=-Infinity,max=Infinity,required=false}={}){
 if(value==null||String(value).trim()==='')return required?invalid('required',`${label} is verplicht`):valid(null);
 const number=Number(value);
 if(!Number.isFinite(number))return invalid('number',`${label} moet een getal zijn`);
 if(number<min)return invalid('min',`${label} moet minimaal ${min} zijn`,{min});
 if(number>max)return invalid('max',`${label} mag maximaal ${max} zijn`,{max});
 return valid(number);
}

export function combineValidation(...results){
 const errors=results.flatMap(result=>Array.isArray(result?.errors)?result.errors:[]);
 return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}
