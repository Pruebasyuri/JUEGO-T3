import json
import struct
from pathlib import Path

import numpy as np

OUT = Path(__file__).resolve().parent.parent / 'models'
OUT.mkdir(parents=True, exist_ok=True)

MATERIALES = {
    'metal':    ((0.20, 0.21, 0.23, 1.0), 0.85, 0.35, None),
    'oscuro':   ((0.07, 0.07, 0.08, 1.0), 0.6, 0.5, None),
    'grip':     ((0.12, 0.10, 0.09, 1.0), 0.0, 0.9, None),
    'madera':   ((0.36, 0.20, 0.09, 1.0), 0.0, 0.8, None),
    'acento':   ((0.85, 0.55, 0.10, 1.0), 0.2, 0.5, None),
    'piel':     ((0.45, 0.58, 0.38, 1.0), 0.0, 0.95, None),
    'camisa':   ((0.45, 0.17, 0.14, 1.0), 0.0, 0.95, None),
    'pantalon': ((0.15, 0.19, 0.27, 1.0), 0.0, 0.95, None),
    'zapato':   ((0.07, 0.07, 0.07, 1.0), 0.0, 0.9, None),
    'sangre':   ((0.35, 0.02, 0.02, 1.0), 0.0, 0.6, None),
    'pelo':     ((0.10, 0.08, 0.06, 1.0), 0.0, 1.0, None),
    'ojo':      ((1.0, 0.1, 0.1, 1.0), 0.0, 0.4, (1.0, 0.05, 0.05)),
}

CARAS = [
    ((1, 0, 0),  [(1, -1, -1), (1, 1, -1), (1, 1, 1), (1, -1, 1)]),
    ((-1, 0, 0), [(-1, -1, 1), (-1, 1, 1), (-1, 1, -1), (-1, -1, -1)]),
    ((0, 1, 0),  [(-1, 1, -1), (-1, 1, 1), (1, 1, 1), (1, 1, -1)]),
    ((0, -1, 0), [(-1, -1, 1), (-1, -1, -1), (1, -1, -1), (1, -1, 1)]),
    ((0, 0, 1),  [(-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]),
    ((0, 0, -1), [(1, -1, -1), (-1, -1, -1), (-1, 1, -1), (1, 1, -1)]),
]


class Nodo:
    def __init__(self, nombre, pos=(0, 0, 0), cajas=None, hijos=None):
        self.nombre = nombre
        self.pos = pos
        self.cajas = cajas or []
        self.hijos = hijos or []


def caja(cx, cy, cz, sx, sy, sz, mat):
    return (cx, cy, cz, sx, sy, sz, mat)


def geometria_caja(c):
    cx, cy, cz, sx, sy, sz, _ = c
    pos, nor, idx = [], [], []
    for n, vs in CARAS:
        base = len(pos)
        for v in vs:
            pos.append((cx + v[0] * sx / 2, cy + v[1] * sy / 2, cz + v[2] * sz / 2))
            nor.append(n)
        idx += [base, base + 1, base + 2, base, base + 2, base + 3]
    return pos, nor, idx


def exportar_glb(raiz, ruta):
    materiales, nombres_mat = [], {}
    buffer = bytearray()
    vistas, accesores, mallas, nodos = [], [], [], []

    def agregar_vista(datos, destino):
        while len(buffer) % 4:
            buffer.append(0)
        vistas.append({'buffer': 0, 'byteOffset': len(buffer), 'byteLength': len(datos), 'target': destino})
        buffer.extend(datos)
        return len(vistas) - 1

    def indice_material(nombre):
        if nombre not in nombres_mat:
            color, metal, rugo, emi = MATERIALES[nombre]
            m = {'name': nombre, 'pbrMetallicRoughness': {
                'baseColorFactor': list(color), 'metallicFactor': metal, 'roughnessFactor': rugo}}
            if emi:
                m['emissiveFactor'] = list(emi)
            materiales.append(m)
            nombres_mat[nombre] = len(materiales) - 1
        return nombres_mat[nombre]

    def construir(nodo):
        entrada = {'name': nodo.nombre}
        if nodo.pos != (0, 0, 0):
            entrada['translation'] = list(nodo.pos)
        if nodo.cajas:
            por_material = {}
            for c in nodo.cajas:
                por_material.setdefault(c[6], []).append(c)
            primitivas = []
            for mat, lista in por_material.items():
                P, N, I = [], [], []
                for c in lista:
                    p, n, i = geometria_caja(c)
                    I += [x + len(P) for x in i]
                    P += p
                    N += n
                P = np.array(P, dtype=np.float32)
                N = np.array(N, dtype=np.float32)
                I = np.array(I, dtype=np.uint16)
                vp = agregar_vista(P.tobytes(), 34962)
                vn = agregar_vista(N.tobytes(), 34962)
                vi = agregar_vista(I.tobytes(), 34963)
                accesores.append({'bufferView': vp, 'componentType': 5126, 'count': len(P), 'type': 'VEC3',
                                  'min': P.min(axis=0).tolist(), 'max': P.max(axis=0).tolist()})
                a_pos = len(accesores) - 1
                accesores.append({'bufferView': vn, 'componentType': 5126, 'count': len(N), 'type': 'VEC3'})
                a_nor = len(accesores) - 1
                accesores.append({'bufferView': vi, 'componentType': 5123, 'count': len(I), 'type': 'SCALAR'})
                a_idx = len(accesores) - 1
                primitivas.append({'attributes': {'POSITION': a_pos, 'NORMAL': a_nor},
                                   'indices': a_idx, 'material': indice_material(mat)})
            mallas.append({'name': nodo.nombre, 'primitives': primitivas})
            entrada['mesh'] = len(mallas) - 1
        nodos.append(entrada)
        mi = len(nodos) - 1
        if nodo.hijos:
            entrada['children'] = [construir(h) for h in nodo.hijos]
        return mi

    construir(raiz)
    gltf = {
        'asset': {'version': '2.0', 'generator': 'generar_modelos.py'},
        'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': nodos, 'meshes': mallas,
        'materials': materiales, 'accessors': accesores, 'bufferViews': vistas,
        'buffers': [{'byteLength': len(buffer)}],
    }
    js = json.dumps(gltf, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    buffer.extend(b'\0' * ((4 - len(buffer) % 4) % 4))
    total = 12 + 8 + len(js) + 8 + len(buffer)
    with open(ruta, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total))
        f.write(struct.pack('<I4s', len(js), b'JSON') + js)
        f.write(struct.pack('<I4s', len(buffer), b'BIN\0') + bytes(buffer))
    print('Generado', ruta, total, 'bytes')


def pistola():
    return Nodo('Pistola', cajas=[
        caja(0, 0.030, -0.100, 0.045, 0.050, 0.300, 'metal'),
        caja(0, 0.030, -0.275, 0.020, 0.020, 0.050, 'oscuro'),
        caja(0, -0.005, -0.060, 0.040, 0.030, 0.220, 'oscuro'),
        caja(0, -0.075, 0.015, 0.040, 0.115, 0.055, 'grip'),
        caja(0, -0.035, -0.035, 0.020, 0.012, 0.070, 'oscuro'),
        caja(0, 0.062, 0.030, 0.014, 0.012, 0.014, 'acento'),
        caja(0, 0.062, -0.230, 0.010, 0.014, 0.010, 'acento'),
    ])


def escopeta():
    return Nodo('Escopeta', cajas=[
        caja(0, 0.030, -0.550, 0.035, 0.035, 0.900, 'metal'),
        caja(0, 0.000, -0.500, 0.030, 0.030, 0.700, 'oscuro'),
        caja(0, 0.015, -0.020, 0.060, 0.075, 0.260, 'oscuro'),
        caja(0, -0.015, -0.500, 0.055, 0.050, 0.220, 'madera'),
        caja(0, -0.010, 0.300, 0.050, 0.090, 0.350, 'madera'),
        caja(0, -0.070, 0.100, 0.040, 0.110, 0.050, 'madera'),
        caja(0, 0.055, -0.980, 0.010, 0.015, 0.010, 'acento'),
    ])


def zombi():
    torso = Nodo('Torso', (0, 1.15, 0), [
        caja(0, 0, 0, 0.50, 0.70, 0.28, 'camisa'),
        caja(0.10, 0.10, 0.145, 0.18, 0.25, 0.01, 'sangre'),
        caja(0, -0.33, 0, 0.52, 0.06, 0.30, 'pantalon'),
    ])
    cabeza = Nodo('Cabeza', (0, 1.52, 0), [
        caja(0, 0.17, 0, 0.28, 0.30, 0.28, 'piel'),
        caja(-0.07, 0.21, 0.145, 0.06, 0.04, 0.02, 'ojo'),
        caja(0.07, 0.21, 0.145, 0.06, 0.04, 0.02, 'ojo'),
        caja(0, 0.33, -0.02, 0.30, 0.05, 0.30, 'pelo'),
        caja(0, 0.08, 0.145, 0.12, 0.05, 0.02, 'sangre'),
    ])

    def brazo(nombre, x):
        return Nodo(nombre, (x, 1.42, 0), [
            caja(0, -0.28, 0, 0.14, 0.60, 0.14, 'piel'),
            caja(0, -0.10, 0, 0.16, 0.25, 0.16, 'camisa'),
        ])

    def pierna(nombre, x):
        return Nodo(nombre, (x, 0.80, 0), [
            caja(0, -0.40, 0, 0.17, 0.80, 0.19, 'pantalon'),
            caja(0, -0.76, 0.04, 0.18, 0.08, 0.26, 'zapato'),
        ])

    return Nodo('Zombi', hijos=[torso, cabeza, brazo('BrazoIzq', 0.34), brazo('BrazoDer', -0.34),
                                pierna('PiernaIzq', 0.13), pierna('PiernaDer', -0.13)])


if __name__ == '__main__':
    exportar_glb(pistola(), OUT / 'arma1.glb')
    exportar_glb(escopeta(), OUT / 'arma2.glb')
    exportar_glb(zombi(), OUT / 'zombie.glb')
