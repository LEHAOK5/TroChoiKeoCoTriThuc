import os
import sys
import qrcode
from PIL import Image, ImageDraw, ImageFont

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def generate_keoco_qr():
    url = "https://keo-co-tri-thuc.vercel.app/"
    output_filename = "QR-TRÒ-CHƠI-KÉO-CO.jpg"
    
    # 1. Generate High-Res QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=20,
        border=3,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    # Dark comic blue (#0F172A or #1A1AFF) on pure white
    qr_img = qr.make_image(fill_color="#0F172A", back_color="#FFFFFF").convert("RGB")
    qr_w, qr_h = qr_img.size # approx 660x660
    
    # 2. Canvas dimensions for poster (Width 1080px, Height 1440px - Standard 3:4 print/screen ratio)
    canvas_w = 1080
    canvas_h = 1440
    
    # Background: Solid #1A1AFF Neo-Brutalism theme
    canvas = Image.new("RGB", (canvas_w, canvas_h), "#1A1AFF")
    draw = ImageDraw.Draw(canvas)
    
    # White Card in center with comic black border
    card_margin_x = 60
    card_margin_y = 60
    card_x0 = card_margin_x
    card_y0 = card_margin_y
    card_x1 = canvas_w - card_margin_x
    card_y1 = canvas_h - card_margin_y
    
    # Comic shadow behind card
    shadow_offset = 12
    draw.rounded_rectangle(
        [card_x0 + shadow_offset, card_y0 + shadow_offset, card_x1 + shadow_offset, card_y1 + shadow_offset],
        radius=28,
        fill="#0F172A"
    )
    
    # White Card background
    draw.rounded_rectangle(
        [card_x0, card_y0, card_x1, card_y1],
        radius=28,
        fill="#FFFFFF",
        outline="#0F172A",
        width=5
    )
    
    # 3. Load Fonts
    font_dir = os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts")
    font_bold = os.path.join(font_dir, "arialbd.ttf")
    font_regular = os.path.join(font_dir, "arial.ttf")
    font_segoe_b = os.path.join(font_dir, "segoeuib.ttf")
    
    f_sub = ImageFont.truetype(font_segoe_b if os.path.exists(font_segoe_b) else font_bold, 28)
    f_title = ImageFont.truetype(font_bold if os.path.exists(font_bold) else font_regular, 54)
    f_desc = ImageFont.truetype(font_segoe_b if os.path.exists(font_segoe_b) else font_bold, 32)
    f_url = ImageFont.truetype(font_bold if os.path.exists(font_bold) else font_regular, 30)
    f_note = ImageFont.truetype(font_regular, 24)
    
    # 4. Header Section
    # Booth Tag Pill: "TRẠM 1: THỬ THÁCH TRÍ TUỆ"
    tag_text = "TRẠM 1: THỬ THÁCH TRÍ TUỆ"
    bbox_tag = draw.textbbox((0, 0), tag_text, font=f_sub)
    tag_w = bbox_tag[2] - bbox_tag[0] + 40
    tag_h = bbox_tag[3] - bbox_tag[1] + 18
    tag_x0 = (canvas_w - tag_w) // 2
    tag_y0 = card_y0 + 40
    
    draw.rounded_rectangle(
        [tag_x0 + 4, tag_y0 + 4, tag_x0 + tag_w + 4, tag_y0 + tag_h + 4],
        radius=999,
        fill="#0F172A"
    )
    draw.rounded_rectangle(
        [tag_x0, tag_y0, tag_x0 + tag_w, tag_y0 + tag_h],
        radius=999,
        fill="#FEF08A",
        outline="#0F172A",
        width=3
    )
    draw.text((tag_x0 + 20, tag_y0 + 7), tag_text, font=f_sub, fill="#713F12")
    
    # Title: "KÉO CO TRI THỨC"
    title_text = "KÉO CO TRI THỨC"
    bbox_title = draw.textbbox((0, 0), title_text, font=f_title)
    title_w = bbox_title[2] - bbox_title[0]
    title_x = (canvas_w - title_w) // 2
    title_y = tag_y0 + tag_h + 20
    
    # Title comic shadow
    draw.text((title_x + 3, title_y + 3), title_text, font=f_title, fill="#0F172A")
    draw.text((title_x, title_y), title_text, font=f_title, fill="#1A1AFF")
    
    # 5. Place QR Code inside a framed box
    qr_box_padding = 24
    qr_box_w = qr_w + qr_box_padding * 2
    qr_box_h = qr_h + qr_box_padding * 2
    qr_box_x = (canvas_w - qr_box_w) // 2
    qr_box_y = title_y + 80
    
    # QR Box Shadow
    draw.rounded_rectangle(
        [qr_box_x + 6, qr_box_y + 6, qr_box_x + qr_box_w + 6, qr_box_y + qr_box_h + 6],
        radius=20,
        fill="#0F172A"
    )
    draw.rounded_rectangle(
        [qr_box_x, qr_box_y, qr_box_x + qr_box_w, qr_box_y + qr_box_h],
        radius=20,
        fill="#FFFFFF",
        outline="#0F172A",
        width=4
    )
    
    # Paste QR Code into center
    canvas.paste(qr_img, (qr_box_x + qr_box_padding, qr_box_y + qr_box_padding))
    
    # 6. Footer Section
    desc_text = "Quét mã bằng Camera hoặc Zalo để vào thi đấu"
    bbox_desc = draw.textbbox((0, 0), desc_text, font=f_desc)
    desc_w = bbox_desc[2] - bbox_desc[0]
    desc_x = (canvas_w - desc_w) // 2
    desc_y = qr_box_y + qr_box_h + 36
    draw.text((desc_x, desc_y), desc_text, font=f_desc, fill="#0F172A")
    
    # URL Pill box
    url_text = url
    bbox_url = draw.textbbox((0, 0), url_text, font=f_url)
    url_w = bbox_url[2] - bbox_url[0] + 36
    url_h = bbox_url[3] - bbox_url[1] + 16
    url_x = (canvas_w - url_w) // 2
    url_y = desc_y + 50
    
    draw.rounded_rectangle(
        [url_x + 4, url_y + 4, url_x + url_w + 4, url_y + url_h + 4],
        radius=12,
        fill="#0F172A"
    )
    draw.rounded_rectangle(
        [url_x, url_y, url_x + url_w, url_y + url_h],
        radius=12,
        fill="#F1F5F9",
        outline="#0F172A",
        width=3
    )
    draw.text((url_x + 18, url_y + 7), url_text, font=f_url, fill="#1A1AFF")
    
    # Bottom Note
    note_text = "Đấu trường đối kháng 2D - Trả lời trắc nghiệm & Đập chuông kéo co"
    bbox_note = draw.textbbox((0, 0), note_text, font=f_note)
    note_w = bbox_note[2] - bbox_note[0]
    note_x = (canvas_w - note_w) // 2
    note_y = url_y + url_h + 24
    draw.text((note_x, note_y), note_text, font=f_note, fill="#64748B")
    
    # Save Image as High Quality JPEG
    output_path = os.path.join(os.getcwd(), output_filename)
    canvas.save(output_path, "JPEG", quality=98)
    print(f"QR Code poster successfully generated at: {output_path}")

if __name__ == "__main__":
    generate_keoco_qr()
