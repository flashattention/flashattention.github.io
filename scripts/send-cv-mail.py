"""이력서 PDF를 메일로 보낸다 (표준 라이브러리만 사용).

쓰는 법: python3 scripts/send-cv-mail.py <PDF 폴더>
환경 변수 (GitHub 저장소 Secrets):
  MAIL_USERNAME  보내는 Gmail 주소
  MAIL_PASSWORD  그 계정의 앱 비밀번호 (Google 계정 → 보안 → 2단계 인증 → 앱 비밀번호)
  MAIL_TO        받는 주소 (없으면 MAIL_USERNAME)
  SMTP_HOST, SMTP_PORT  기본 smtp.gmail.com, 465
"""
import json
import os
import smtplib
import sys
from email.message import EmailMessage
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
pdf_dir = Path(sys.argv[1])
pdfs = sorted(pdf_dir.glob("*.pdf"))
if not pdfs:
    sys.exit(f"{pdf_dir}에 PDF가 없습니다")

user, password = os.environ.get("MAIL_USERNAME"), os.environ.get("MAIL_PASSWORD")
if not user or not password:
    sys.exit("MAIL_USERNAME / MAIL_PASSWORD 가 없습니다. 저장소 Settings → Secrets and variables → Actions 에 등록하세요.")
to = os.environ.get("MAIL_TO") or user

s = json.loads((ROOT / "assets/portfolio/stats.json").read_text(encoding="utf-8"))
asof = s.get("jelly.asof", "")
lines = [
    f"오늘 사이트 수치로 만든 이력서입니다 (커밋 기준 {asof}, 운영 지표 기준 {s.get('jelly.mdate', '')}).",
    "",
    f"- 웹게임 {s.get('jelly.games')}종 · {s.get('jelly.days')}일 동안 출시·운영",
    f"- 커밋 {s.get('jelly.commits')}개 중 {s.get('jelly.agent')}개 에이전트 공동 작성 · JavaScript 약 {s.get('jelly.lines')}줄",
    f"- 드림 러너 {s.get('jelly.plays')}판 · {s.get('jelly.hours')}시간 · 순위표 {s.get('jelly.lbTotal')}명 중 {s.get('jelly.lbGuest')}명({s.get('jelly.lbPct')}) 비로그인",
    f"- 서울 러너 건물 약 {s.get('seoul.buildings')} 채 · 가게 약 {s.get('seoul.shops')} 곳",
    f"- AgentLab {s.get('agentlab.lessons')}개 강의 · Latent Atlas 개념 {s.get('atlas.concepts')}개",
    "",
    "첨부: 검정 배경(화면용), 흰 배경(인쇄용)",
    "사이트: https://flashattention.github.io/",
]

msg = EmailMessage()
msg["Subject"] = f"[이력서] 전은배 AI Native SW Engineer · {asof} 수치"
msg["From"] = user
msg["To"] = to
msg.set_content("\n".join(lines))
for p in pdfs:
    msg.add_attachment(p.read_bytes(), maintype="application", subtype="pdf", filename=p.name)

host, port = os.environ.get("SMTP_HOST") or "smtp.gmail.com", int(os.environ.get("SMTP_PORT") or 465)
with smtplib.SMTP_SSL(host, port, timeout=60) as smtp:
    smtp.login(user, password)
    smtp.send_message(msg)
print(f"sent {len(pdfs)} PDF(s)")
