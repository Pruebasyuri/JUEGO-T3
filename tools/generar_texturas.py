import os

import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), "..", "textures")


def ruido(n, beta, seed):
    rng = np.random.default_rng(seed)
    F = np.fft.fft2(rng.standard_normal((n, n)))
    fx = np.fft.fftfreq(n)[:, None]
    fy = np.fft.fftfreq(n)[None, :]
    f = np.sqrt(fx ** 2 + fy ** 2)
    f[0, 0] = 1
    r = np.real(np.fft.ifft2(F / f ** beta))
    return (r - r.min()) / (r.max() - r.min())


def guardar(img, nombre):
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(
        os.path.join(OUT, nombre), quality=90)


def asfalto(n=512):
    grande = ruido(n, 1.6, 11)
    fino = ruido(n, 0.5, 12)
    grietas = np.clip(1 - np.abs(ruido(n, 1.5, 13) - 0.5) * 30, 0, 1)
    base = 0.16 + 0.16 * grande + 0.06 * fino
    img = np.stack([base, base, base * 1.05], axis=-1)
    img *= (1 - 0.6 * grietas[..., None])
    guardar(img, "asfalto.jpg")


def concreto(n=512):
    grande = ruido(n, 1.7, 21)
    medio = ruido(n, 1.0, 22)
    manchas = ruido(n, 2.0, 23)
    base = 0.38 + 0.22 * grande + 0.08 * medio - 0.12 * (manchas > 0.62)
    img = np.stack([base, base * 0.98, base * 0.94], axis=-1)
    y, x = np.mgrid[0:n, 0:n]
    junta = ((x % (n // 2)) < 3) | ((y % (n // 2)) < 3)
    img[junta] *= 0.6
    guardar(img, "concreto.jpg")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    asfalto()
    concreto()
    print("Texturas generadas en", os.path.abspath(OUT))
