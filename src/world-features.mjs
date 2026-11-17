// One registry for world destinations, bounded deep links and object-bound tools.
export const WORLD_FEATURES = Object.freeze([
 {id:'hom-nay',title:'Hũ hẹn hò',scene:'phong-choi',object:'huHenHo',place:'Hũ hẹn hò · phòng hoạt động'},
 {id:'nhat-ky',title:'Sổ những buổi hẹn',scene:'phong-choi',object:'huHenHo',place:'Góc hẹn hò'},
 {id:'bo-luat',title:'Lời hứa của hai đứa',scene:'xuong',object:'bangGhim',place:'Bảng ghim · xưởng sáng tạo'},
 {id:'khu-vuon',title:'Cây chung và các mùa hoa',scene:'san',object:'luongTrong',place:'Khu vườn'},
 {id:'tu-lanh',title:'Giấy nhắn trên tủ lạnh',scene:'bep',object:'tuLanh',place:'Tủ lạnh · phòng bếp'},
 {id:'thu',title:'Thư hẹn giờ',scene:'san',object:'hopThu',place:'Hộp thư'},
 {id:'uoc-mo',title:'Ước mơ của hai đứa',scene:'xuong',object:'loUocMo',place:'Lọ ước mơ · xưởng sáng tạo'},
 {id:'truyen',title:'Cùng viết truyện trực tiếp',scene:'xuong',object:'mayDanhChu',place:'Bàn viết · xưởng sáng tạo'},
 {id:'ve',title:'Cùng vẽ tranh trực tiếp',scene:'xuong',object:'giaVe',place:'Giá vẽ · xưởng sáng tạo'},
 {id:'vuong-quoc',title:'Vương quốc',scene:'san',object:'benThuyen',place:'Bến thuyền'},
 {id:'tu-dien',title:'Từ điển riêng',scene:'bao-tang',object:'keSach',place:'Kệ sách · bảo tàng'},
 {id:'bao-tang',title:'Kỷ vật của hai đứa',scene:'bao-tang',object:'tuKinh',place:'Tủ kỷ niệm · bảo tàng'},
 {id:'ban-do',title:'Những nơi đã cùng đi',scene:'bao-tang',object:'banDo',place:'Bản đồ · bảo tàng'},
 {id:'gifts',route:'nha',panel:'gifts',title:'Hộp quà',scene:'san',object:'cayHoa',place:'Cây anh đào'},
 {id:'pet',route:'phong-khach',panel:'petCard',title:'Chăm bé thú chung',scene:'ngu',object:'oMeo',place:'Ổ mèo · phòng ngủ'},
 {id:'dates',route:'nha',panel:'dates',title:'Ngày của hai đứa',scene:'nha',object:'banDo',place:'Bàn kỷ niệm'},
 {id:'badges',route:'gac',panel:'badges',title:'Huy hiệu của hai đứa',scene:'bao-tang',object:'tuKinh',place:'Tủ kỷ niệm · bảo tàng'},
 {id:'so-chung',route:'nha',title:'Sổ tay của hai đứa',scene:'xuong',object:'banLamViec',place:'Bàn chung · xưởng sáng tạo'},
 {id:'settings',title:'Tài khoản và ngôi nhà',place:'Sổ tay'}
]);
export const featureOf=id=>WORLD_FEATURES.find(f=>f.id===id)||null;
export function featureFromHash(hash){const id=String(hash||'').replace(/^#/,'');return featureOf(id==='cac-mua'?'khu-vuon':id);}
export function worldUrl(base,user){const url=new URL('./nha3d/index.html',base);url.searchParams.set('host','1');url.searchParams.set('cloud',user.cloud?'1':'0');url.searchParams.set('scene','san');if(user.who==='anh'||user.who==='em')url.searchParams.set('me',user.who);return url;}
export const validWorldMessage=(event,frame,origin)=>event.source===frame&&event.origin===origin&&event.data&&typeof event.data==='object';
// A record id the world may point at (a note or letter to highlight). Never HTML or a selector.
export const focusId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(v)?v:null;
// The only actions the world may ask the host to run, each through the app's existing handler.
export const WORLD_ACTIONS=Object.freeze({'tu-lanh':['heart'],'hom-nay':['draw','play','swap']});
export function worldAction(d){
 if(!d||typeof d.feature!=='string'||typeof d.action!=='string')return null;
 if(!(WORLD_ACTIONS[d.feature]||[]).includes(d.action))return null;
 const id=d.id===undefined?null:focusId(d.id);if(d.action==='heart'&&!id)return null;
 return {feature:d.feature,action:d.action,id};
}
