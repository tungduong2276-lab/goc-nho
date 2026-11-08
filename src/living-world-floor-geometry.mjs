/**
 * Góc Nhỏ · V2 physical-floor review data, source canvas: 1170×1170.
 *
 * Floor polygons are inset from the VISIBLE floor edge of the corresponding
 * assets/3d/*_ngay.webp backgrounds. Footprints follow the furniture BASES
 * in the rendered item sprites and deliberately EXCLUDE their long blue
 * shadows, high backs, wall frames, and transparent layer padding.
 *
 * This is a reviewed-by-image PROTOTYPE, NOT final physical collision approval.
 * It is the opt-in local V2 navigation layer only; no persistence.
 *
 * Room item IDs correspond to assets/3d/scene.json. The independent living
 * room uses SC3.room.layers and the garden uses SC3.rooms.khu_vuon.layers.
 */
const rectangle=(left,top,right,bottom)=>[[left,top],[right,top],[right,bottom],[left,bottom]];
const mainFloor=[[585,429],[1023,682],[585,946],[147,682]];
const atticFloor=[[466,494],[935,739],[622,947],[166,727]];
const gardenFloor=[[585,453],[1007,663],[585,915],[164,663]];

/**
 * 'exit' is a safe point near the open front edge of a pre-rendered floor.
 * NONE of the current background art contains a drawn doorway. Label this
 * as the open route back to the house map, NOT an architectural door.
 */
const definitions={
  "phong-khach":{
    floor:mainFloor,exit:[585,909],
    furniture:{
      sofa:[[174,584],[302,515],[442,579],[330,710]],
      bantra:rectangle(502,677,694,781),
      radio:rectangle(906,619,994,736)
    }
  },
  "bep":{
    floor:mainFloor,exit:[585,917],
    furniture:{
      tulanh:[[545,445],[629,429],[695,481],[611,535]],
      bepnau:[[645,507],[741,468],[808,512],[700,576]],
      banan:[[444,670],[570,620],[704,687],[563,783]],
      quaybep:[[771,575],[939,608],[1008,699],[763,743]]
    }
  },
  "phong-anh":{
    floor:mainFloor,exit:[585,917],
    furniture:{
      giuong:[[415,488],[556,420],[688,509],[542,615]],
      tudo:rectangle(661,485,819,598),
      banlamviec:[[833,580],[929,557],[1006,624],[919,713]]
    }
  },
  "phong-em":{
    floor:mainFloor,exit:[585,914],
    furniture:{
      giuong:[[421,474],[553,398],[696,499],[543,616]],
      bantrangdiem:[[780,580],[906,549],[990,625],[864,708]],
      kecay:rectangle(206,548,363,641)
    }
  },
  "goc-sang-tao":{
    floor:mainFloor,exit:[585,917],
    furniture:{
      giave:rectangle(370,550,514,654),
      maydanhchu:[[849,587],[927,556],[1013,632],[931,722]],
      hopmau:rectangle(682,619,758,690)
    }
  },
  "gac":{
    floor:atticFloor,exit:[621,907],
    furniture:{
      ghenho:rectangle(239,572,396,678),
      tukinh:rectangle(387,518,534,617),
      ruong:rectangle(486,713,634,840)
    }
  },
  "khu-vuon":{
    floor:gardenFloor,exit:[585,877],
    furniture:{
      cay:rectangle(511,531,659,694),
      xichdu:rectangle(238,520,510,630),
      ke:rectangle(667,531,944,632),
      bang:rectangle(642,704,754,769)
    }
  }
};
const deepFreeze=value=>{
  if(value && typeof value==="object"){
    for(const v of Object.values(value))deepFreeze(v);
    Object.freeze(value);
  }
  return value;
};
export const ROOM_FLOORS=deepFreeze(definitions);
export const SCENE_COORDINATES=deepFreeze({width:1170,height:1170,source:"assets/3d/scene.json"});
