# Вся озвучка одним запросом: vo/voiceover.mp3 + границы сцен по словам → vo/timing.json
import asyncio, json, sys, edge_tts
VOICE, RATE = 'ru-RU-DmitryNeural', (sys.argv[1] if len(sys.argv) > 1 else '+8%')
segs = json.load(open('vo_script.json', encoding='utf-8'))
text = ' '.join(s['say'] for s in segs)
async def run():
    words, audio = [], bytearray()
    c = edge_tts.Communicate(text, VOICE, rate=RATE, boundary='WordBoundary')
    async for m in c.stream():
        if m['type'] == 'audio': audio.extend(m['data'])
        elif m['type'] == 'WordBoundary': words.append({'t': m['offset'] / 1e7, 'd': m['duration'] / 1e7, 'w': m['text']})
    return words, audio
for attempt in range(8):
    try: words, audio = asyncio.run(run()); break
    except edge_tts.exceptions.NoAudioReceived: print('retry', attempt + 1); asyncio.run(asyncio.sleep(5 + attempt * 5))
else: raise SystemExit('no audio')
open('vo/voiceover.mp3', 'wb').write(audio)
# слова каждой сцены: считаем словоформы (без знаков препинания) по порядку
import re
tok = lambda s: [w for w in re.findall(r"[\w\-]+", s)]
i, out = 0, []
for s in segs:
    n = len(tok(s['say'])); ws = words[i:i + n]; i += n
    out.append({'id': s['id'], 'start': round(ws[0]['t'], 3), 'end': round(ws[-1]['t'] + ws[-1]['d'], 3), 'sub': s['sub'], 'words': [[round(w['t'], 3), round(w['t'] + w['d'], 3), w['w']] for w in ws]})
json.dump(out, open('vo/timing.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('words', len(words), 'matched', i)
for o in out: print(o['id'], o['start'], '→', o['end'], f"({o['end'] - o['start']:.1f}s)", o['words'][0][2], '…', o['words'][-1][2])
