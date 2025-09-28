#!/usr/bin/env python3
import re, csv, zipfile, argparse, xml.etree.ElementTree as ET
from pathlib import Path

# --- Wzorce i stałe ---
NS = {'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'}
ZIP_RE = re.compile(r'\b\d{2}\s*[-–]?\s*\d{3}\b')
NAME_RE = re.compile(r'^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)+$')
STREET_HINT = re.compile(r'\b(ul\.|ulica|al\.|aleja|pl\.)\b', re.I)

# krótka lista popularnych imion PL do detekcji kolejności (możesz rozszerzyć)
COMMON_FIRST_NAMES = {
    "Anna","Agnieszka","Barbara","Katarzyna","Maria","Małgorzata","Ewa","Joanna","Elżbieta","Zofia",
    "Iwona","Halina","Danuta","Beata","Grażyna","Teresa","Monika","Jadwiga","Magdalena","Renata",
    "Krzysztof","Piotr","Tomasz","Paweł","Marek","Andrzej","Jan","Adam","Rafał","Grzegorz","Łukasz",
    "Mariusz","Maciej","Marcin","Mateusz","Dariusz","Wojciech","Jarosław","Jerzy"
}

def read_paragraphs_from_odt(odt_path: Path):
    """Czyta paragrafy (text:p) z content.xml w kolejności wystąpień."""
    with zipfile.ZipFile(odt_path, 'r') as z:
        xml_bytes = z.read("content.xml")
    root = ET.fromstring(xml_bytes)
    paras = []
    for p in root.findall('.//text:p', NS):
        t = ''.join(p.itertext())
        t = re.sub(r'\s+', ' ', t).strip()
        if t:
            paras.append(t)
    return paras

def fix_spaced_letters(s: str) -> str:
    """Składa rozstrzelone litery: 'Ś w i d n i k' -> 'Świdnik', 'I r e n a  G u z y' -> 'Irena Guzy'."""
    t = s.strip()
    if re.fullmatch(r'(?:[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]\s+){3,}[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż](?:\s+[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+)*', t):
        t2 = re.sub(r'\s+', '', t)
        t2 = re.sub(r'(?<=[a-ząćęłńóśźż])(?=[A-ZĄĆĘŁŃÓŚŹŻ])', ' ', t2)
        return t2
    return s

def extract_from_paras(paras, src_file):
    """Ekstrakcja bloku po 'Sz. P.' lub wokół linii z kodem pocztowym."""
    idx = next((i for i,p in enumerate(paras) if re.search(r'\bSz\.\s*P\.', p, re.I)), None)
    if idx is None:
        for i,p in enumerate(paras):
            if ZIP_RE.search(p):
                idx = max(0, i-2)
                break
    if idx is None:
        return None

    block = paras[idx+1: idx+6]  # zwykle 3–4 linie
    if not block:
        return None

    name = fix_spaced_letters(block[0])
    if not NAME_RE.match(name):
        for ln in block[1:3]:
            cand = fix_spaced_letters(ln)
            if NAME_RE.match(cand):
                name = cand
                break

    street = ''
    postcode = ''
    city = ''

    for ln in block:
        ln_norm = ln.replace('–','-').replace('—','-')
        if not street and (STREET_HINT.search(ln_norm) or re.search(r'\d', ln_norm)):
            street = ln_norm
        m = ZIP_RE.search(ln_norm)
        if m and not postcode:
            code = m.group(0)
            postcode = re.sub(r'\s+', '', code.replace('–','-').replace('—','-'))
            tail = ln_norm[m.end():].strip()
            if tail:
                city = tail

    if (postcode and not city):
        for i,ln in enumerate(block):
            if ZIP_RE.search(ln):
                if i+1 < len(block):
                    city = block[i+1].strip()
                break

    # sanity: jeśli "street" wygląda jak imię+nazwisko, wyzeruj
    if street and NAME_RE.match(fix_spaced_letters(street)):
        street = ''

    # normalizacja końcowa
    name   = name.strip()
    street = fix_spaced_letters(street.strip())
    city   = fix_spaced_letters(city.strip())
    return {
        'source': src_file,
        'name': name,
        'street': street,
        'postcode': postcode.strip(),
        'city': city
    }

def walk_and_extract(root: Path):
    rows = []
    for p in root.rglob('*.odt'):
        try:
            paras = read_paragraphs_from_odt(p)
            rec = extract_from_paras(paras, str(p))
            if rec:
                rows.append(rec)
            else:
                rows.append({'source': str(p), 'name':'', 'street':'', 'postcode':'', 'city':''})
        except Exception as e:
            rows.append({'source': str(p), 'name':'', 'street':'', 'postcode':'', 'city':f'ERROR: {e}'})
    return rows

# --- Normalizacja do formatu docelowego ---

def split_name(full_name: str):
    """
    Heurystyka:
      - standard: first = pierwszy token, last = reszta,
      - jeśli DOKŁADNIE dwa tokeny i drugi jest znanym polskim imieniem (a pierwszy nie),
        to zamieniamy kolejność (obsługa 'Tujaka Agnieszka' -> first='Agnieszka', last='Tujaka').
    """
    if not full_name:
        return ("","")
    parts = full_name.split()
    if len(parts) == 1:
        return (parts[0], "")
    if len(parts) == 2:
        a, b = parts[0], parts[1]
        if (b in COMMON_FIRST_NAMES) and (a not in COMMON_FIRST_NAMES):
            return (b, a)
        return (a, b)
    return (parts[0], " ".join(parts[1:]))

def split_street_and_number(street: str):
    """
    Zwraca (street_without_number, number_combined).
    Zasada 'więcej do numeru':
      - 'ul. 3-go Maja 10 / 15' -> ('ul. 3-go Maja', '10/15')
      - 'Narutowicza 3, 7A'     -> ('Narutowicza', '3/7A')
      - 'Lipowa 10'             -> ('Lipowa', '10')
      - 'Jarosławiec 86 A'      -> ('Jarosławiec', '86 A')
      - 'Bazylianówka 81/12 A'  -> ('Bazylianówka', '81/12A')
    """
    if not street:
        return ("","")
    s = street.strip()
    s = s.replace('–','-').replace('—','-')
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'\s*/\s*', '/', s)    # "10 / 15" -> "10/15"
    s = re.sub(r'\s*,\s*', ', ', s)   # przecinki

    # 1) num/apt + opcjonalna litera po spacji: "... 81/12 A" -> apt "81/12A"
    m = re.match(r'^(?P<st>.+?)\s+(?P<n1>\d+[\w\-]*)/(?P<n2>[\w\-]+)(?:\s*(?P<let>[A-Za-zĄĆĘŁŃÓŚŹŻ]))?$', s)
    if m:
        n1, n2, ltr = m.group('n1'), m.group('n2'), m.group('let') or ''
        return (m.group('st').strip(), f"{n1}/{n2}{ltr}")

    # 2) "..., apt" i numer domu tuż przed przecinkiem -> "house/apt"
    m = re.match(r'^(?P<st_no>.+?)\s+(?P<house>\d+[\w\-]*)\s*,\s*(?P<apt>[\w\-]+)$', s)
    if m:
        return (m.group('st_no').strip(), f"{m.group('house')}/{m.group('apt')}")

    # 3) "..., coś" (bez numeru domu po nazwie ulicy)
    m = re.match(r'^(?P<st>.+?),\s*(?P<tail>[\w\-]+)$', s)
    if m:
        return (m.group('st').strip(), m.group('tail'))

    # 4) numer na końcu z literą oddzieloną spacją: "... 86 A"
    m = re.match(r'^(?P<st>.+?)\s+(?P<num>\d+\s*[A-Za-zĄĆĘŁŃÓŚŹŻ])$', s)
    if m:
        return (m.group('st').strip(), re.sub(r'\s+', ' ', m.group('num')).strip())

    # 5) numer na końcu z literą zbitą lub myślnikiem: "... 86A" / "... 86-A"
    m = re.match(r'^(?P<st>.+?)\s+(?P<num>\d+[\w\-]*)$', s)
    if m:
        return (m.group('st').strip(), m.group('num').strip())

    # 6) nic nie pasuje – zwróć wszystko jako ulicę
    return (s, "")

def write_raw_csv(rows, out_dir: Path, filename="addresses.csv"):
    outp = out_dir / filename
    with outp.open('w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['source','name','street','postcode','city'])
        w.writeheader()
        w.writerows(rows)
    return outp

def write_formatted_csv(rows, out_dir: Path, filename="addresses-format.csv"):
    outp = out_dir / filename
    with outp.open('w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(["id","first_name","last_name","street","apartment_no","city","postal_code","label_marked"])
        for i, r in enumerate(rows, start=1):
            fn, ln = split_name(r.get('name',''))
            st_only, apt = split_street_and_number(r.get('street',''))
            city = fix_spaced_letters(r.get('city',''))
            pc   = r.get('postcode','')
            w.writerow([i, fn, ln, st_only, apt, city, pc, 1])
    return outp

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', required=True, help='Katalog startowy do skanowania .odt (rekurencyjnie)')
    ap.add_argument('--out-dir', default='.', help='Katalog docelowy na pliki wynikowe')
    args = ap.parse_args()

    root = Path(args.root)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    rows = walk_and_extract(root)

    raw_path = write_raw_csv(rows, out_dir, "addresses.csv")
    fmt_path = write_formatted_csv(rows, out_dir, "addresses-format.csv")

    print(f"[OK] Zapisano {len(rows)} rekordów")
    print(f" - {raw_path}")
    print(f" - {fmt_path}")

if __name__ == '__main__':
    main()
