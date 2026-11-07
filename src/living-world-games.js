/* Góc Nhỏ · Hũ hẹn hò V2 + bộ sticker bổ sung.
 * Data-only extension of current GAMES / STK. No Firebase migrations or writes.
 */
(function () {
"use strict";
var extraGames = [
  {n:31,g:"cung",name:"Điệp vụ HAI MẬT MÃ",desc:"Mỗi người nhận 2 mục tiêu bí mật, không được nói thẳng. Trong buổi hẹn, phải dẫn dắt người kia tự nguyện hoàn thành. Cuối buổi lật thẻ, đoán ai đã gài được bao nhiêu nhiệm vụ. Mỗi ván bốc nhiệm vụ mới.",aux:[{label:"Mục tiêu bí mật",count:4,list:["Khiến người kia nói từ 'phi thuyền'","Làm hai đứa cùng chọn một món chưa từng thử","Thuyết phục chụp ảnh cả hai cùng nhắm mắt","Dẫn câu chuyện đến hồi nhỏ đi học","Khiến người kia tự đặt biệt danh cho một vật","Làm cả hai cùng hát một câu tự chế","Khiến người kia tự đề xuất một điểm dừng mới","Dẫn người kia chọn một món có màu xanh"]}]},
  {n:32,g:"vai",name:"Quán ăn ngoài vũ trụ",desc:"Mỗi người thiết kế 3 món ăn kỳ dị từ những nguyên liệu có thật ở điểm hẹn. Phải thuyết phục người kia đặt món bằng cách thuyết minh như đầu bếp sao Hỏa. Chấm theo độ hài và tính khả thi; không cần ăn món kỳ quặc.",aux:[{label:"Quy tắc nhà hàng",list:["Mọi tên món có ít nhất 7 âm tiết","Khách hàng là vua của một hành tinh khác","Chỉ được quảng cáo bằng phép so sánh","Mỗi món đi kèm một siêu năng lực","Thực đơn là các vụ án bí ẩn"]}]},
  {n:33,g:"doan",name:"Bảo tàng những điều vô lý",desc:"Hai đứa chọn 5 đồ vật bình thường tại chỗ rồi mỗi người bịa một công dụng cực kỳ vô lý. Đối phương phải đoán đâu là công dụng thật và đâu là huyền thoại. Vòng sau đổi vai giám tuyển.",aux:[{label:"Chủ đề bảo tàng",list:["Đồ vật bị nguyền rủa nhưng rất lịch sự","Công nghệ năm 3000","Bí mật hoàng cung","Vật dụng của loài mèo","Công cụ sinh tồn ngày tận thế"]}]},
  {n:34,g:"luat",name:"Phiên đấu giá kỳ cục",desc:"Mỗi người có 10 đồng xu tưởng tượng. Lần lượt đem đấu giá 6 quyền lợi dễ thương như chọn nhạc, đặt tên đồ uống hay quyết định góc chụp. Không được vượt ngân sách; người ít xu còn lại được quyền thêm một luật.",aux:[{label:"Lô hàng",count:6,list:["Chọn món tráng miệng","Đặt biệt danh cho nhau một giờ","Chọn chủ đề ảnh kế tiếp","Đặt tên cho cái cây bất kỳ","Đổi playlist 15 phút","Chọn ai kể chuyện trước","Chọn hình phạt nhẹ khi thua","Giành quyền chọn vị trí ngồi"]}]},
  {n:35,g:"cung",name:"Bản đồ không có đường",desc:"Chọn 3 điểm gần nhau, mỗi ngã rẽ oẳn tù tì quyết định hướng đi; mỗi nơi ghé qua phải đặt tên mới và lưu một chi tiết đáng nhớ. Có nút bỏ qua địa điểm không an toàn hoặc không phù hợp.",aux:[{label:"Bộ quy tắc",list:["Rẽ trái nếu thấy màu đỏ","Đi về phía có cây xanh","Đi theo hướng mùi đồ ăn","Mỗi điểm dừng phải có vật hình tròn","Chọn một nơi chưa từng chụp ảnh"]}]},
  {n:36,g:"vai",name:"Phiên tòa của chiếc bánh",desc:"Một người là luật sư, người kia là công tố. Chọn đồ vật bất kỳ làm bị cáo và bào chữa/truy tố tội vô lý như 'quá ngon'. Sau 3 phút đổi vai; ghi lại câu biện hộ đáng nhớ nhất.",aux:[{label:"Tội danh",list:["Quá đáng yêu","Gây thèm ăn tập thể","Giả vờ vô tội","Chiếm trọn ánh nhìn","Mắc chứng thích được chụp hình","Chủ mưu khiến cả hai cười"]}]},
  {n:37,g:"tao",name:"Bộ phim chỉ có một đạo cụ",desc:"Bốc một đạo cụ an toàn đang có và một thể loại. Cả hai phải diễn câu chuyện 90 giây với đạo cụ ấy đóng ít nhất ba vai; quay lại nếu muốn. Chơi lại bằng đạo cụ hoặc thể loại mới.",aux:[{label:"Thể loại",list:GENRES},{label:"Đạo cụ",list:["Chiếc cốc","Túi giấy","Chiếc lá","Cây bút","Khăn tay","Một cái ghế","Chiếc ô","Một quyển sổ"]}]},
  {n:38,g:"doan",name:"Người kia sẽ làm gì?",desc:"Một người bí mật chọn trong 3 hành động tự nhiên, người kia dự đoán lựa chọn trước khi lật thẻ. Đúng được 1 điểm; đổi vai sau mỗi lượt. Mỗi vòng thay chủ đề và lý do, tránh lặp câu.",aux:[{label:"Tình huống",list:["Nếu nhặt được kho báu nhỏ","Nếu có một ngày nghỉ bất ngờ","Nếu được chọn thú cưng kỳ quặc","Nếu bị đổi giọng trong một giờ","Nếu trúng vé đi tới một nơi bất kỳ","Nếu xây quán cà phê riêng"]}]},
  {n:39,g:"cung",name:"Đội cứu hộ hẹn hò",desc:"Hai người bị 'kẹt' trong một tình huống tưởng tượng. Mỗi người nhận 3 tài nguyên bất kỳ và chỉ dùng lời nói để hợp tác cứu cả đội; phải thống nhất kế hoạch trước khi kết thúc lượt.",aux:[{label:"Tình huống",list:["Tàu hỏa đang chở toàn mèo","Cửa tiệm bị mưa kẹo kéo tấn công","Lâu đài làm bằng bánh tan chảy","Bảo tàng mất hết biển tên","Đảo hoang chỉ có một tiệm trà sữa"]},{label:"Tài nguyên",count:6,list:["Cuộn dây","Một cái muỗng","Đèn pin","Hai cục nam châm","Tờ bản đồ","Chú gấu bông","Cục tẩy","Một cái nón","Chiếc chai","Túi hạt giống"]}]},
  {n:40,g:"luat",name:"Lệnh tua lại",desc:"Mỗi người có 3 thẻ 'Tua lại'. Bất cứ khi nào nghe một câu bình thường, có thể yêu cầu người kia diễn lại theo thể loại bốc được; cuối lượt cả hai chọn câu diễn lại hay nhất.",aux:[{label:"Phong cách diễn lại",count:5,list:["MC bản tin","Phản diện phim cổ trang","Hoàng tử/công chúa thất lạc","Robot hết pin","Nhân vật phim kiếm hiệp","Giọng kể chuyện trinh thám","Phim truyền hình dài tập","Người đang trúng số"]}]},
  {n:41,g:"cung",name:"Hộp thư đến từ tương lai",desc:"Chọn một năm tương lai; lần lượt gửi 3 bưu thiếp ngắn cho hai người ở thời điểm đó. Người kia phải trả lời như đang sống trong tương lai ấy. Câu kỳ lạ nhất được lưu vào kỷ niệm.",aux:[{label:"Mốc thời gian",list:["Sau 3 tháng","Sau 1 năm","Sau 5 năm","Sau 10 năm","Sau 30 năm","Năm 2222"]}]},
  {n:42,g:"tao",name:"Nhạc kịch không nhạc",desc:"Mỗi người phải biến một đoạn hội thoại bình thường thành lời hát ngẫu hứng không dựa trên bài có bản quyền; đối phương thêm điệp khúc tự sáng tác. Chơi ba vòng, mỗi vòng một cảm xúc.",aux:[{label:"Cảm xúc",count:3,list:["Vô cùng nghiêm trọng","Vui như trúng số","Bí ẩn","Mơ màng","Giận dỗi giả vờ","Hào hùng như ra trận"]}]},
  {n:43,g:"cung",name:"Săn vật phẩm truyền thuyết",desc:"Chọn 5 đặc tính vật phẩm, cả hai cùng tìm đồ vật đáp ứng nhiều đặc tính nhất ở nơi hẹn. Có thể chỉ chụp; không động vào đồ của người khác. Cuối cùng đặt tên và cấp độ cho vật phẩm.",aux:[{label:"5 đặc tính",count:5,list:["Màu vàng","Nhỏ hơn nắm tay","Có hình trái tim","Có vết xước","Phản chiếu ánh sáng","Có chữ trên đó","Nhìn giống sinh vật","Màu pastel","Hình tam giác","Có ít nhất hai chức năng"]}]},
  {n:44,g:"doan",name:"Bản đồ ký ức sai sai",desc:"Mỗi người kể một kỷ niệm chung thật, nhưng cố tình thay đổi 3 chi tiết nhỏ. Người kia có 90 giây phát hiện; rồi đổi vai. Mọi chi tiết được nói trước là chơi đùa, không thành tranh cãi đúng sai.",aux:[{label:"Loại chi tiết để thay",count:3,list:["Địa điểm","Món ăn","Màu sắc","Thời gian","Ai nói câu đầu tiên","Một vật trong cảnh","Thời tiết","Âm thanh"]}]},
  {n:45,g:"vai",name:"Nhà báo điều tra tình yêu",desc:"Một người là phóng viên đang điều tra tin giật gân như 'vì sao bạn ấy mê trà sữa'. Người kia là nhân chứng vòng vo. Sau 4 câu hỏi phải viết headline 10 từ hài hước; đổi vai.",aux:[{label:"Vụ án",list:["Người ấy giấu tài năng gì?","Chiếc bánh biến mất","Ai đã ăn miếng cuối?","Vì sao người này luôn cười?","Tình nghi là người ngoài hành tinh","Vụ mất tích của chiếc tất"]}]},
  {n:46,g:"cung",name:"Đảo chính sách vớ vẩn",desc:"Hai người phải xây 5 đạo luật hài hước cho một thành phố tưởng tượng, rồi người kia tìm lỗ hổng khiến luật khó áp dụng. Sau đó cùng sửa thành bộ luật hợp lý và buồn cười hơn.",aux:[{label:"Thành phố",list:["Thành phố gấu bông","Vương quốc trà sữa","Đảo toàn mèo","Thị trấn chỉ ngủ ban ngày","Hành tinh ai cũng nói vần","Đảo hoa biết nói"]}]},
  {n:47,g:"tao",name:"Đầu bếp bị mất trí nhớ",desc:"Người A mô tả món ăn bằng hình dáng và cảm xúc nhưng không được nói nguyên liệu hay tên. Người B đoán và tưởng tượng công thức; sau hai lượt đổi vai. Câu mô tả sáng tạo nhất được ghi lại.",aux:[{label:"Loại món",list:["Món tuổi thơ","Món đầu tiên ăn cùng nhau","Món ăn vặt","Món nước","Món tự nấu","Món chỉ xuất hiện trong mơ"]}]},
  {n:48,g:"luat",name:"Ba nút điều khiển con người",desc:"Mỗi người có đúng một lượt dùng các nút 'Tua nhanh', 'Chậm lại', 'Lồng tiếng'. Trong vòng 10 phút được yêu cầu người kia diễn lại một hành động bình thường theo nút đã chọn; không chạm vùng riêng tư hay làm nơi công cộng khó xử.",aux:[{label:"Nút hiệu ứng",list:["Tua nhanh ×2","Slow motion ×0.25","Lồng tiếng phim tài liệu","Hoạt hình câm","Nói như game thủ","Hành động như robot"]}]},
  {n:49,g:"cung",name:"Thử thách tiệm đồ thất lạc",desc:"Cả hai chọn 3 thứ bất kỳ có thể nhìn thấy. Mỗi người bí mật viết một câu chuyện chủ sở hữu bị thất lạc; rồi trao cho nhau và phải dựng tiếp câu chuyện bằng một tình tiết bất ngờ.",aux:[{label:"Bối cảnh",list:["Quán cà phê không tồn tại","Trạm tàu xuyên thời gian","Tiệm hoa ở cuối phố","Rạp phim bỏ hoang","Cửa hàng phép thuật","Lễ hội của các con vật"]}]},
  {n:50,g:"doan",name:"Thám tử tiếng động",desc:"Một người tạo 5 âm thanh nhỏ bằng vật dụng sẵn có khi người kia quay lưng (không bịt mắt bắt buộc). Người kia đoán nguồn âm; sau đó đổi vai và tăng độ khó bằng hai âm nối tiếp.",aux:[{label:"Loại âm",count:3,list:["Tiếng nước","Tiếng giấy","Gõ nhịp","Xào xạc","Kim loại nhỏ","Búng tay","Tiếng cốc","Âm thanh mô phỏng động vật"]}]},
  {n:51,g:"cung",name:"Khách sạn trái tim kỳ cục",desc:"Hai người thiết kế một khách sạn chỉ có 5 phòng theo chủ đề ngẫu nhiên. Một người là kiến trúc sư, một người là khách khó tính; phải thuyết phục nhau và vẽ phác thảo 2 phút rồi đổi vai.",aux:[{label:"Phong cách khách sạn",list:["Dưới đáy đại dương","Trên lưng rùa","Làm từ bánh ngọt","Bay trên mây","Trong chiếc tủ lạnh khổng lồ","Ở một thế giới tí hon"]}]},
  {n:52,g:"tao",name:"Một tấm ảnh, ba thể loại",desc:"Chụp một đồ vật hoặc khung cảnh hai người đều đồng ý. Lần lượt đặt 3 caption theo 3 thể loại đối lập và cùng bình chọn caption buồn cười nhất. Mỗi lần chơi đổi ảnh mới.",aux:[{label:"3 thể loại",count:3,list:["Kinh dị","Lãng mạn","Cổ trang","Phim trinh thám","Khoa học viễn tưởng","Bản tin thời sự","Quảng cáo bán hàng","Thơ lục bát"]}]},
  {n:53,g:"cung",name:"Lật kèo cuối buổi",desc:"Mỗi người nhận 3 thẻ nhiệm vụ. Khi hoàn thành một nhiệm vụ, có thể đổi chéo một thẻ còn lại với người kia; phải thương lượng bằng một câu thuyết phục. Người hoàn tất nhiều nhất thắng, không trừng phạt.",aux:[{label:"Nhiệm vụ",count:6,list:["Đặt tên cho một cái cây","Làm cả hai bật cười","Tự sáng tác câu quảng cáo","Tìm hai đồ vật cùng màu","Chọn một món mới để ăn","Chụp ảnh bóng hai người","Tìm một góc có ánh sáng đẹp","Đoán bài hát người kia đang nghĩ","Tạo câu chuyện từ ba từ bất kỳ"]}]},
  {n:54,g:"vai",name:"Bộ đôi siêu phản diện",desc:"Hai đứa là hai phản diện yếu xìu muốn chiếm lấy một quán đồ uống. Mỗi người bốc một siêu năng lực vô dụng, phải trình bày kế hoạch phối hợp 60 giây. Sau đó đổi vị trí người chỉ huy.",aux:[{label:"Năng lực vô dụng",count:2,list:["Làm trà sữa ấm lên một độ","Biến một chiếc lá thành hai","Biết nói chuyện với cái cốc","Đổi màu tất trong 3 giây","Dịch tiếng mèo nhưng thường đoán sai","Biến cái muỗng thành micro","Triệu hồi một chiếc bong bóng","Thổi giấy bay đúng 2 cm"]}]}
];
var known=new Set(GAMES.map(function (g) {return g.n;}));
extraGames.forEach(function (game) {if(!known.has(game.n)){GAMES.push(game);known.add(game.n);}});
Object.assign(TIMERS,{31:15,34:10,37:2,39:8,40:10,42:5,44:2,45:4,48:10,50:3,51:5,53:15,54:2});
PENALTIES.push(
  "Tự sáng tác một biệt danh ngớ ngẩn và dùng trong 10 phút",
  "Diễn lại cảnh gặp nhau như phim cổ trang trong 20 giây",
  "Khen người kia bằng ba phép so sánh không được lặp",
  "Vẽ một trái tim bằng tay không thuận",
  "Nói lời xin chào như robot mới khởi động",
  "Tự nghĩ một câu slogan cho hai đứa",
  "Làm MC giới thiệu món nước của người kia",
  "Giả làm chú mèo đang thuyết phục xin ăn 15 giây",
  "Chọn một sticker và diễn tả nó không dùng lời",
  "Tự bịa tên khoa học cho một cây trong tầm mắt",
  "Kể chuyện tình yêu của hai chiếc muỗng trong 30 giây",
  "Cho người kia chọn một bài hát để cả hai cùng nghe",
  "Đọc một câu tình cảm như đang đọc bản tin thời sự",
  "Nhường quyền chọn tráng miệng lần này",
  "Vẽ người kia bằng năm nét bút",
  "Đóng vai nhân viên tổng đài hẹn hò 1 phút",
  "Gửi một tin nhắn bằng đúng bảy từ",
  "Tạo điệu nhảy tay 5 giây để người kia bắt chước",
  "Viết lời chúc ước mơ cho hai người lên một mẩu giấy",
  "Đặt tên cho hôm nay như tên một bộ phim",
  "Đoán ba đồ vật người kia đang nghĩ bằng câu hỏi có/không",
  "Đổi vai người kể chuyện trong một vòng",
  "Nói một câu bình thường theo giọng phản diện đáng yêu",
  "Chụp một tấm ảnh với biểu cảm được cả hai đồng ý"
);
BONUSES.push(
  "Được chọn màn chơi tiếp theo",
  "Được đặt tên cho cây/chậu mới trong vườn",
  "Được chọn một sticker dán vào kỷ niệm hôm nay",
  "Người thắng chọn concept ảnh chung kế tiếp",
  "Nhận một mẩu giấy khen tự sáng tác",
  "Cả hai được mở một lượt hẹn hò tự chọn",
  "Được làm đạo diễn một câu thoại của người kia",
  "Được chọn món tráng miệng cho hai đứa"
);
// Emoji sticker placeholders for low-weight gameplay. Bespoke authored PNG/WebP atlas comes later.
var more = {
  "gn2-otter":["🦦","Rái cá ôm tim"],"gn2-capy":["🦫","Capybara thư giãn"],
  "gn2-panda":["🐼","Gấu trúc"],"gn2-duck":["🐤","Vịt vàng"],
  "gn2-frog":["🐸","Ếch xanh"],"gn2-shiba":["🐕","Cún Shiba"],
  "gn2-hamster":["🐹","Chuột hamster"],"gn2-unicorn":["🦄","Ngựa kỳ lân"],
  "gn2-fox":["🦊","Cáo nhỏ"],"gn2-koala":["🐨","Koala ngủ gật"],
  "gn2-butter":["🧈","Cục bơ"],"gn2-donut":["🍩","Bánh donut"],
  "gn2-pudding":["🍮","Pudding"],"gn2-cookie":["🍪","Bánh quy"],
  "gn2-croissant":["🥐","Bánh sừng bò"],"gn2-peach":["🍑","Đào hồng"],
  "gn2-blueberry":["🫐","Việt quất"],"gn2-avocado":["🥑","Bơ tí hon"],
  "gn2-pizza":["🍕","Pizza"],"gn2-sushi":["🍣","Sushi"],
  "gn2-pancake":["🥞","Bánh kếp"],"gn2-mochi":["🍡","Dango"],
  "gn2-milk":["🥛","Ly sữa"],"gn2-tea":["🍵","Trà xanh"],
  "gn2-spark":["💖","Trái tim lấp lánh"],"gn2-pink":["💕","Hai trái tim"],
  "gn2-heart-letter":["💌","Thư tình"],"gn2-ribbon":["🎀","Ruy băng"],
  "gn2-wand":["🪄","Đũa phép"],"gn2-gift":["🎁","Quà nhỏ"],
  "gn2-candle":["🕯️","Nến thơm"],"gn2-planet":["🪐","Hành tinh"],
  "gn2-telescope":["🔭","Kính thiên văn"],"gn2-bubble":["🫧","Bong bóng"],
  "gn2-sunflower":["🌻","Hướng dương"],"gn2-blossom":["🌸","Hoa anh đào"]
};
Object.keys(more).forEach(function (key) {
  if(STK[key])return;
  STK[key]='<span class="gn2-sticker-glyph" aria-hidden="true">'+more[key][0]+'</span>';
  STK_NAME[key]=more[key][1];
});
window.__GN_GAMES_V2__={extraGames:extraGames.length,extraStickers:Object.keys(more).length,
    penaltiesAdded:24,bonusesAdded:8};
})();