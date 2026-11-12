const $ = (id) => document.getElementById(id);

export function createHud() {
  const el = {
    menu: $('menu'),
    menuMsg: $('menuMsg'),
    weapon: $('weaponName'),
    ammo: $('ammo'),
    other: $('ammoOther'),
    zombies: $('zleft'),
    dist: $('dist'),
    toast: $('toast'),
    hit: $('hitmarker'),
    end: $('end'),
    endTitle: $('endTitle'),
    endMsg: $('endMsg'),
  };
  let toastTimer = 0;
  let hitTimer = 0;

  return {
    setMenu(message, visible = true) {
      el.menuMsg.textContent = message;
      el.menu.style.display = visible ? 'grid' : 'none';
    },
    setWeapon(info) {
      el.weapon.textContent = info.name;
      el.ammo.textContent = info.ammo;
      el.ammo.classList.toggle('empty', info.ammo === 0);
      el.other.textContent = `${info.otherName}: ${info.otherAmmo}`;
    },
    setZombies(n) { el.zombies.textContent = n; },
    setDistance(m) { el.dist.textContent = m; },
    toast(text) {
      el.toast.textContent = text;
      el.toast.style.opacity = 1;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { el.toast.style.opacity = 0; }, 1600);
    },
    hitMarker(killed) {
      el.hit.className = killed ? 'kill' : 'hit';
      clearTimeout(hitTimer);
      hitTimer = setTimeout(() => { el.hit.className = ''; }, 150);
    },
    showEnd(title, message, kind) {
      el.endTitle.textContent = title;
      el.endMsg.textContent = message;
      el.end.className = kind;
    },
  };
}
