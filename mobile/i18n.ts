import messages from "./messages.en.json";
export function mobileTranslator(locale:"vi"|"en"){return (value:string)=>locale==="en"?(messages as Record<string,string>)[value]||value:value}
