const PLAYERS=["Jackie Buursen","Bobbi Cornelissen","Nine Gilissen","Coco-Mijn Kolenaar","Ella Korkmaz","Eline Molhoek","Lidewij Prinsen","Tess de Regt","Femke van Roosmalen","Cato Smit","Steffi ten Thij","Lieselot ten Vergert","Lizzy Wegter","Isis Zwanenburg"];
const PLAYER_IDS={"Jackie Buursen":"3c8da36a-ac8a-8167-bae4-d6c1f450a887","Bobbi Cornelissen":"3c8da36a-ac8a-811c-b1a3-d4f3e41c9593","Nine Gilissen":"3c8da36a-ac8a-817a-8eaa-e679066a31bd","Coco-Mijn Kolenaar":"3c8da36a-ac8a-81e8-aa76-e09d6b82b81e","Ella Korkmaz":"3c8da36a-ac8a-811d-9813-f5d6fc205ce3","Eline Molhoek":"3c8da36a-ac8a-8172-be8e-edcebf4832cc","Lidewij Prinsen":"3c8da36a-ac8a-81b1-acb7-f8e8eda38d7e","Tess de Regt":"3c8da36a-ac8a-8146-bc7c-fe5ba75cb460","Femke van Roosmalen":"3c8da36a-ac8a-81d8-a8c9-f7d179d6138d","Cato Smit":"3c8da36a-ac8a-814c-b9c4-e1add4e34252","Steffi ten Thij":"3c8da36a-ac8a-8199-86e8-fe8850a6098c","Lieselot ten Vergert":"3c8da36a-ac8a-8105-901b-d99320ddc13c","Lizzy Wegter":"3c8da36a-ac8a-81d1-a30d-fe308ef29d93","Isis Zwanenburg":"3c8da36a-ac8a-81ee-8479-caa892554450"};
const FORMATION_IDS={433:"3c8da36a-ac8a-81d5-8b0f-d131a908d995",343:"3c8da36a-ac8a-8174-b522-d21195bb3a9b",442:"3c8da36a-ac8a-8105-b646-c480ed3d487e"};
const REVIEWERS=[{id:"floris",name:"Floris"},{id:"daan",name:"Daan"},{id:"loes",name:"Loes"},{id:"annerieke-kolenaar",name:"Annerieke Kolenaar"},{id:"esther",name:"Esther"}];
const WRITE_URL="https://hook.eu1.make.com/rt3igfy8ge3jjebw4kbi7rwm14p6ekoo";
const READ_URL="https://hook.eu1.make.com/wfqtaxr78aleyol9473khtxdsm9h1cy7";
const LINEUP_URL="https://hook.eu1.make.com/u5ui4ocwq2zurhqqr9hxvgt1y2tqaou6";
const LS_KEY="pw-mo14-multirater-v2", REVIEWER_KEY="pw-mo14-active-reviewer";
const METRICS=[
 {id:"techniek",label:"Techniek",desc:"Aanname, pass, flats, drijven."},
 {id:"spelinzicht",label:"Spelinzicht",desc:"Scannen, ruimte zien, volgende actie."},
 {id:"verdedigen",label:"1-tegen-1 verdedigen",desc:"Timing, voetenwerk, stick, duel."},
 {id:"snelheid",label:"Snelheid",desc:"Versnellen, diepte, herstel."},
 {id:"loopvermogen",label:"Loopvermogen",desc:"Aansluiten en blijven omschakelen."},
 {id:"rust",label:"Rust aan de bal",desc:"Goede keuze onder druk."},
 {id:"aanvallend",label:"Aanvallend instinct",desc:"Vrijlopen, cirkel, rebound, afronding."},
 {id:"communicatie",label:"Communicatie",desc:"Coachen, helpen, organiseren."},
 {id:"balbezit",label:"Balbezit",desc:"Aanspeelbaar, vooruit spelen, tempo en bal houden."},
 {id:"nietBalbezit",label:"Niet-balbezit",desc:"Druk, lijn dicht, rugdekking, positionering."},
 {id:"omschakeling",label:"Omschakeling",desc:"Direct reageren op balwinst en balverlies."},
 {id:"moed",label:"Moed",desc:"Durven handelen, duel aangaan, opnieuw proberen."},
 {id:"winnendeKracht",label:"Winnende kracht",desc:"Doorzetten, verantwoordelijkheid, wedstrijdenergie."},
 {id:"teamgedrag",label:"Teamgedrag",desc:"Voor elkaar werken, positief coachen, teambelang."}
];
const PROFILE={
 GK:[.05,.07,.16,.03,.03,.16,.01,.15,.05,.12,.06,.03,.04,.04],
 FB:[.10,.08,.18,.14,.08,.06,.02,.04,.08,.10,.06,.02,.02,.02],
 CB:[.07,.15,.18,.04,.05,.13,.01,.10,.07,.11,.05,.01,.01,.02],
 WM:[.12,.09,.05,.15,.14,.05,.06,.04,.11,.04,.07,.02,.02,.04],
 CM:[.13,.15,.06,.04,.11,.13,.04,.06,.12,.04,.05,.01,.01,.05],
 W:[.16,.07,.02,.19,.08,.04,.15,.02,.10,.02,.05,.04,.03,.03],
 ST:[.13,.08,.01,.10,.05,.04,.23,.03,.07,.01,.04,.08,.07,.06]
};
const POSITION_LABEL={GK:"Keeper",FB:"Back",CB:"Centraal achter",WM:"Buitenmidden",CM:"Centraal midden",W:"Buitenspits",ST:"Centrumspits"};
const FORMATIONS={
 433:[["GK","Keeper",9,50],["FB","Linksachter",25,14],["CB","Links centraal",25,38],["CB","Rechts centraal",25,62],["FB","Rechtsachter",25,86],["WM","Linksmidden",51,23],["CM","Centraal midden",51,50],["WM","Rechtsmidden",51,77],["W","Linksvoor",79,17],["ST","Spits",79,50],["W","Rechtsvoor",79,83]],
 343:[["GK","Keeper",9,50],["CB","Links achter",27,22],["CB","Centraal achter",27,50],["CB","Rechts achter",27,78],["WM","Linksmidden",51,12],["CM","Links centraal",51,38],["CM","Rechts centraal",51,62],["WM","Rechtsmidden",51,88],["W","Linksvoor",79,17],["ST","Spits",79,50],["W","Rechtsvoor",79,83]],
 442:[["GK","Keeper",9,50],["FB","Linksachter",25,14],["CB","Links centraal",25,38],["CB","Rechts centraal",25,62],["FB","Rechtsachter",25,86],["WM","Linksmidden",52,12],["CM","Links centraal",52,38],["CM","Rechts centraal",52,62],["WM","Rechtsmidden",52,88],["ST","Linkerspits",79,36],["ST","Rechterspits",79,64]]
};
let drafts=JSON.parse(localStorage.getItem(LS_KEY)||"{}"), activeReviewer=localStorage.getItem(REVIEWER_KEY)||"", centralAssessments=[], teamViews={}, currentFormation="433", lastSync=null;
