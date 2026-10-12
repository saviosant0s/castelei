"""Grava a narração das etapas com uma voz aberta, de graça e sem conta.

Uso:
    node scripts/narracao-textos.mjs licao.json > textos.json
    python scripts/narrar.py textos.json [--voz faber]

Precisa de `pip install piper-tts lameenc soundfile` e do modelo da voz em
--modelos (padrão /tmp/ttsm), baixado de huggingface.co/rhasspy/piper-voices
(pt/pt_BR/<voz>/medium). Grava frontend/public/narracao/<chave>.mp3 e acrescenta
a chave a frontend/src/lib/narracao.json — é essa lista que acende o botão.

A chave é o resumo do texto, não da pronúncia: o dicionário abaixo muda só o
que a voz FALA, e o texto da tela continua sendo o que decide o arquivo.
"""
import argparse, io, json, re, wave
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "frontend/public/narracao"
LISTA = RAIZ / "frontend/src/lib/narracao.json"

# A voz lê tudo como português. Termo em inglês sai soletrado do jeito errado
# ("Númber Rácê"), então ele ganha uma grafia que a voz pronuncia certo.
FRASES = {
    "Number Race": "Nâmber Rêice", "NumberRace": "Nâmber Rêice",
    "JSON Lines": "djêison láins", "Pull Request": "púl riquést",
    "SHA-256": "chá 256", "GitHub": "Guít-Râb",
}
PALAVRAS = {
    "json": "djêison", "jsonl": "djêison éle", "lines": "láins", "sqlite": "és-quiú-láite",
    "sql": "és-quiú-él", "csv": "cê-ésse-vê", "uuid": "u-u-i-dê", "pr": "pê-érre",
    "tcc": "tê-cê-cê", "kb": "quilobaites", "mb": "megabaites", "wav": "uáve",
    "riff": "rífe", "fork": "fórque", "commit": "comíte", "merge": "mêrdje",
    "branch": "bréntch", "schema": "squíma", "windows": "Uíndous", "python": "Páiton",
    "java": "Djáva", "junit": "djêi-iúnit", "analytics": "anélitics",
    "integrity": "intégriti", "byte": "baite", "bytes": "baites", "answer": "énsuer",
    "event": "ivênt", "events": "ivênts", "type": "táipe", "id": "ai-dí",
    "session": "séchon", "participant": "partícipant", "turn": "târn",
    "number": "nâmber", "game": "guêime", "version": "vêrchon", "sequence": "síquens",
    "interaction": "interéction", "logger": "lóguer", "sink": "sinque",
    "export": "éxport", "tool": "túl", "registry": "réjistri", "data": "dêita",
    "friend": "frénd", "two": "tú", "db": "dê bê", "bat": "béti", "race": "Rêice",
}

def pronuncia(texto):
    for de, para in FRASES.items():
        texto = texto.replace(de, para)
    def ident(m):
        sep = {".": " ponto ", "/": " barra "}
        out = []
        for p in re.split(r"([_./\-]|(?<=[a-z])(?=[A-Z]))", m.group(0)):
            if p in sep: out.append(sep[p])
            elif p in ("_", "-", ""): out.append(" ")
            else: out.append(PALAVRAS.get(p.lower(), p))
        return re.sub(r"\s+", " ", "".join(out)).strip()
    return re.sub(r"[A-Za-z][A-Za-z0-9]*(?:[_./\-][A-Za-z0-9]+)*|[A-Za-z]+", ident, texto)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("textos")
    ap.add_argument("--voz", default="faber")
    ap.add_argument("--modelos", default="/tmp/ttsm")
    ap.add_argument("--kbps", type=int, default=40)
    ap.add_argument("--refazer", action="store_true")
    a = ap.parse_args()

    import lameenc, soundfile as sf
    from piper import PiperVoice, SynthesisConfig
    voz = PiperVoice.load(f"{a.modelos}/pt_BR-{a.voz}-medium.onnx")
    cfg = SynthesisConfig(length_scale=1.05)  # um pouco mais devagar: é aula

    PASTA.mkdir(parents=True, exist_ok=True)
    chaves = set(json.loads(LISTA.read_text()))
    for item in json.loads(Path(a.textos).read_text()):
        destino = PASTA / f"{item['key']}.mp3"
        if destino.exists() and not a.refazer:
            chaves.add(item["key"]); continue
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            voz.synthesize_wav(pronuncia(item["text"]), w, syn_config=cfg)
        buf.seek(0)
        som, taxa = sf.read(buf, dtype="int16")
        enc = lameenc.Encoder()
        enc.set_bit_rate(a.kbps); enc.set_in_sample_rate(taxa); enc.set_channels(1); enc.set_quality(2)
        destino.write_bytes(enc.encode(som.tobytes()) + enc.flush())
        chaves.add(item["key"])
        print(f"{item['key']}  {item['lesson']} › {item['step']}")
    LISTA.write_text(json.dumps(sorted(chaves), indent=1) + "\n")

if __name__ == "__main__":
    main()
