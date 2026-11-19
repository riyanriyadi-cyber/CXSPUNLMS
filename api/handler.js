// FILE HASIL BUILD — jangan diedit. Sumber: server/*.mjs, perintah: npm run build:api
import {createRequire as __cr} from 'node:module'; const require = __cr(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b2) => (typeof require !== "undefined" ? require : a)[b2]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/entities/dist/decode-codepoint.js
function isInvalidCodePoint(codePoint) {
  return codePoint === 0 || codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111;
}
function replaceCodePoint(codePoint) {
  if (isInvalidCodePoint(codePoint)) {
    return 65533;
  }
  if (codePoint >= 128 && codePoint <= 159) {
    return c1[codePoint - 128] || codePoint;
  }
  return codePoint;
}
function replaceCodePointXML(codePoint) {
  return isInvalidCodePoint(codePoint) ? 65533 : codePoint;
}
var c1;
var init_decode_codepoint = __esm({
  "node_modules/entities/dist/decode-codepoint.js"() {
    c1 = [
      8364,
      0,
      8218,
      402,
      8222,
      8230,
      8224,
      8225,
      710,
      8240,
      352,
      8249,
      338,
      0,
      381,
      0,
      0,
      8216,
      8217,
      8220,
      8221,
      8226,
      8211,
      8212,
      732,
      8482,
      353,
      8250,
      339,
      0,
      382,
      376
    ];
  }
});

// node_modules/entities/dist/internal/decode-shared.js
function decodeTrieDict(input, resultLength, atomCount, dict1AtomCount, ngramCount, dictSize) {
  const base = 91;
  const inputLength = input.length;
  const twoCharBias = dictSize * (base - 1);
  let pos = 0;
  const readSlotCode = () => {
    const c12 = BASE91_INVERSE[input.charCodeAt(pos++)];
    return c12 < dictSize ? c12 : c12 * base - twoCharBias + BASE91_INVERSE[input.charCodeAt(pos++)];
  };
  const dict2AtomCount = atomCount - dict1AtomCount;
  const slotCount = atomCount + ngramCount;
  const single = new Int32Array(slotCount);
  single.fill(-1, dict1AtomCount, dictSize);
  single.fill(-1, dictSize + dict2AtomCount, slotCount);
  const start = new Int32Array(slotCount);
  const length = new Int32Array(slotCount);
  function decodeDelta(count, off) {
    let previous = 0;
    let slot = off;
    const end = off + count;
    while (slot < end) {
      const code = BASE91_INVERSE[input.charCodeAt(pos++)];
      if (code < 89) {
        previous += code;
        single[slot++] = previous;
      } else if (code === 89) {
        let runLength = BASE91_INVERSE[input.charCodeAt(pos++)] + 2;
        while (runLength--)
          single[slot++] = ++previous;
      } else {
        const next = BASE91_INVERSE[input.charCodeAt(pos++)];
        previous += 89 + // eslint-disable-next-line unicorn/prefer-minimal-ternary -- branches read a different number of side-effecting input bytes
        (next < 90 ? next * base + BASE91_INVERSE[input.charCodeAt(pos++)] : BASE91_INVERSE[input.charCodeAt(pos++)] * 8281 + BASE91_INVERSE[input.charCodeAt(pos++)] * base + BASE91_INVERSE[input.charCodeAt(pos++)]);
        single[slot++] = previous;
      }
    }
  }
  decodeDelta(dict1AtomCount, 0);
  decodeDelta(dict2AtomCount, dictSize);
  const references = new Int32Array(ngramCount * 2);
  let poolSize = 0;
  let ngramIndex = 0;
  function readNgramReferences(count, startSlot) {
    for (let index = 0; index < count; index++) {
      const slot = startSlot + index;
      const a = readSlotCode();
      const b2 = readSlotCode();
      references[ngramIndex * 2] = a;
      references[ngramIndex * 2 + 1] = b2;
      ngramIndex += 1;
      start[slot] = poolSize;
      const entryLength = (single[a] < 0 ? length[a] : 1) + (single[b2] < 0 ? length[b2] : 1);
      length[slot] = entryLength;
      poolSize += entryLength;
    }
  }
  readNgramReferences(ngramCount - dictSize + dict1AtomCount, dictSize + dict2AtomCount);
  readNgramReferences(dictSize - dict1AtomCount, dict1AtomCount);
  const pool = new Uint16Array(poolSize);
  let write = 0;
  for (let index = 0; index < ngramIndex; index++) {
    for (let half = 0; half < 2; half++) {
      const source = references[index * 2 + half];
      const value = single[source];
      if (value < 0) {
        let read = start[source];
        const readEnd = read + length[source];
        while (read < readEnd)
          pool[write++] = pool[read++];
      } else {
        pool[write++] = value;
      }
    }
  }
  const out = new Uint16Array(resultLength);
  let outIndex = 0;
  while (pos < inputLength) {
    let slot = BASE91_INVERSE[input.charCodeAt(pos++)];
    if (slot >= dictSize) {
      slot = slot * base - twoCharBias + BASE91_INVERSE[input.charCodeAt(pos++)];
    }
    const value = single[slot];
    if (value < 0) {
      let read = start[slot];
      const readEnd = read + length[slot];
      while (read < readEnd)
        out[outIndex++] = pool[read++];
    } else {
      out[outIndex++] = value;
    }
  }
  return out;
}
var BASE91_INVERSE;
var init_decode_shared = __esm({
  "node_modules/entities/dist/internal/decode-shared.js"() {
    BASE91_INVERSE = /* @__PURE__ */ (() => {
      const table = new Uint8Array(127);
      let code = 0;
      for (let char = 33; char <= 126; char++) {
        if (char !== 34 && char !== 36 && char !== 92) {
          table[char] = code++;
        }
      }
      return table;
    })();
  }
});

// node_modules/entities/dist/generated/decode-data-html.js
var htmlDecodeTree;
var init_decode_data_html = __esm({
  "node_modules/entities/dist/generated/decode-data-html.js"() {
    init_decode_shared();
    htmlDecodeTree = /* @__PURE__ */ decodeTrieDict("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61);
  }
});

// node_modules/entities/dist/generated/decode-data-xml.js
var xmlDecodeTree;
var init_decode_data_xml = __esm({
  "node_modules/entities/dist/generated/decode-data-xml.js"() {
    xmlDecodeTree = /* @__PURE__ */ new Uint16Array([
      512,
      26465,
      29036,
      7,
      0,
      2,
      4,
      116,
      24638,
      116,
      24636,
      8693,
      29807,
      24610,
      621,
      1,
      0,
      0,
      3,
      112,
      24614,
      111,
      115,
      24615
    ]);
  }
});

// node_modules/entities/dist/internal/bin-trie-flags.js
var BinTrieFlags;
var init_bin_trie_flags = __esm({
  "node_modules/entities/dist/internal/bin-trie-flags.js"() {
    (function(BinTrieFlags2) {
      BinTrieFlags2[BinTrieFlags2["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
      BinTrieFlags2[BinTrieFlags2["FLAG13"] = 8192] = "FLAG13";
      BinTrieFlags2[BinTrieFlags2["BRANCH_LENGTH"] = 8064] = "BRANCH_LENGTH";
      BinTrieFlags2[BinTrieFlags2["JUMP_TABLE"] = 127] = "JUMP_TABLE";
      BinTrieFlags2[BinTrieFlags2["VALUE_MASK"] = 8191] = "VALUE_MASK";
    })(BinTrieFlags || (BinTrieFlags = {}));
  }
});

// node_modules/entities/dist/decode.js
function isNumber(code) {
  return code - CharCodes.ZERO >>> 0 <= 9;
}
function isHexadecimalCharacter(code) {
  return (code | TO_LOWER_BIT) - CharCodes.LOWER_A >>> 0 <= 5;
}
function isAlpha(code) {
  return (code | TO_LOWER_BIT) - CharCodes.LOWER_A >>> 0 <= 25;
}
function isEntityInAttributeInvalidEnd(code) {
  return code === CharCodes.EQUALS || isAlpha(code) || isNumber(code);
}
function determineBranch(decodeTree, current, nodeIndex, char) {
  const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
  const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
  if (jumpOffset) {
    if (branchCount === 0) {
      return char === jumpOffset ? nodeIndex : -1;
    }
    const slot = char - jumpOffset;
    if (slot >>> 0 >= branchCount)
      return -1;
    const stored = decodeTree[nodeIndex + slot];
    return stored === 0 ? -1 : nodeIndex + branchCount + stored - 1 & 65535;
  }
  if (branchCount === 0)
    return -1;
  const packedKeySlots = branchCount + 1 >> 1;
  const branchEnd = nodeIndex + packedKeySlots + branchCount;
  for (let index = 0; index < branchCount; index++) {
    const packed = decodeTree[nodeIndex + (index >> 1)];
    const key = packed >> ((index & 1) << 3) & 255;
    if (key === char) {
      const pointerIndex = nodeIndex + packedKeySlots + index;
      return branchEnd + decodeTree[pointerIndex] & 65535;
    }
    if (key > char)
      return -1;
  }
  return -1;
}
var CharCodes, TO_LOWER_BIT, EntityDecoderState, DecodingMode, EntityDecoder;
var init_decode = __esm({
  "node_modules/entities/dist/decode.js"() {
    init_decode_codepoint();
    init_decode_data_xml();
    init_bin_trie_flags();
    init_decode_data_html();
    init_decode_data_xml();
    (function(CharCodes3) {
      CharCodes3[CharCodes3["AMP"] = 38] = "AMP";
      CharCodes3[CharCodes3["NUM"] = 35] = "NUM";
      CharCodes3[CharCodes3["SEMI"] = 59] = "SEMI";
      CharCodes3[CharCodes3["EQUALS"] = 61] = "EQUALS";
      CharCodes3[CharCodes3["ZERO"] = 48] = "ZERO";
      CharCodes3[CharCodes3["NINE"] = 57] = "NINE";
      CharCodes3[CharCodes3["LOWER_A"] = 97] = "LOWER_A";
      CharCodes3[CharCodes3["LOWER_X"] = 120] = "LOWER_X";
    })(CharCodes || (CharCodes = {}));
    TO_LOWER_BIT = 32;
    (function(EntityDecoderState2) {
      EntityDecoderState2[EntityDecoderState2["EntityStart"] = 0] = "EntityStart";
      EntityDecoderState2[EntityDecoderState2["NumericStart"] = 1] = "NumericStart";
      EntityDecoderState2[EntityDecoderState2["NumericDecimal"] = 2] = "NumericDecimal";
      EntityDecoderState2[EntityDecoderState2["NumericHex"] = 3] = "NumericHex";
      EntityDecoderState2[EntityDecoderState2["NamedEntity"] = 4] = "NamedEntity";
    })(EntityDecoderState || (EntityDecoderState = {}));
    (function(DecodingMode2) {
      DecodingMode2[DecodingMode2["Legacy"] = 0] = "Legacy";
      DecodingMode2[DecodingMode2["Strict"] = 1] = "Strict";
      DecodingMode2[DecodingMode2["Attribute"] = 2] = "Attribute";
    })(DecodingMode || (DecodingMode = {}));
    EntityDecoder = class {
      decodeTree;
      emitCodePoint;
      errors;
      /** The current state of the decoder. */
      state = EntityDecoderState.EntityStart;
      /** Characters that were consumed while parsing an entity. */
      consumed = 1;
      /**
       * The result of the entity.
       *
       * For named entities: the trie index of the best legacy match so far
       * (0 = none). For numeric entities: the accumulated code point.
       */
      result = 0;
      /** The current index in the decode tree. */
      treeIndex = 0;
      /**
       * Characters consumed since the last recorded legacy match, plus one.
       * Invariant at the top of the `stateNamedEntity` loop: `excess` equals
       * the number of unrecorded consumed characters + 1.
       */
      // biome-ignore lint/correctness/noUnusedPrivateClassMembers: False positive (read via destructuring)
      excess = 1;
      /** The mode in which the decoder is operating. */
      decodeMode = DecodingMode.Strict;
      /** The number of characters that have been consumed in the current run. */
      // biome-ignore lint/correctness/noUnusedPrivateClassMembers: False positive
      runConsumed = 0;
      constructor(decodeTree, emitCodePoint, errors) {
        this.decodeTree = decodeTree;
        this.emitCodePoint = emitCodePoint;
        this.errors = errors;
      }
      /**
       * Resets the instance to make it reusable.
       * @param decodeMode Entity decoding mode to use.
       */
      startEntity(decodeMode) {
        this.decodeMode = decodeMode;
        this.state = EntityDecoderState.EntityStart;
        this.result = 0;
        this.treeIndex = 0;
        this.excess = 1;
        this.consumed = 1;
        this.runConsumed = 0;
      }
      /**
       * Write an entity to the decoder. This can be called multiple times with partial entities.
       * If the entity is incomplete, the decoder will return -1.
       *
       * Mirrors the non-streaming `decodeWithTrie`, but with the ability to stop decoding if the
       * entity is incomplete, and resume when the next string is written.
       * @param input The string containing the entity (or a continuation of the entity).
       * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
       * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
       */
      write(input, offset) {
        switch (this.state) {
          case EntityDecoderState.EntityStart: {
            if (input.charCodeAt(offset) === CharCodes.NUM) {
              this.state = EntityDecoderState.NumericStart;
              this.consumed += 1;
              return this.stateNumericStart(input, offset + 1);
            }
            this.state = EntityDecoderState.NamedEntity;
            return this.stateNamedEntity(input, offset);
          }
          case EntityDecoderState.NumericStart: {
            return this.stateNumericStart(input, offset);
          }
          case EntityDecoderState.NumericDecimal: {
            return this.stateNumericDecimal(input, offset);
          }
          case EntityDecoderState.NumericHex: {
            return this.stateNumericHex(input, offset);
          }
          default: {
            return this.stateNamedEntity(input, offset);
          }
        }
      }
      /**
       * Switches between the numeric decimal and hexadecimal states.
       *
       * Equivalent to the `Numeric character reference state` in the HTML spec.
       * @param input The string containing the entity (or a continuation of the entity).
       * @param offset The current offset.
       * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
       */
      // eslint-disable-next-line unicorn/consistent-class-member-order
      stateNumericStart(input, offset) {
        if (offset >= input.length) {
          return -1;
        }
        if ((input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
          this.state = EntityDecoderState.NumericHex;
          this.consumed += 1;
          return this.stateNumericHex(input, offset + 1);
        }
        this.state = EntityDecoderState.NumericDecimal;
        return this.stateNumericDecimal(input, offset);
      }
      /**
       * Parses a hexadecimal numeric entity.
       *
       * Equivalent to the `Hexademical character reference state` in the HTML
       * spec. Digit parsing matches the hex loop in `parseNumericEntity`.
       * The accumulated value is preserved for numeric validation callbacks.
       * @param input The string containing the entity (or a continuation of the entity).
       * @param offset The current offset.
       * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
       */
      stateNumericHex(input, offset) {
        const inputLength = input.length;
        let { result } = this;
        let { consumed } = this;
        while (offset < inputLength) {
          const char = input.charCodeAt(offset);
          if (isNumber(char) || isHexadecimalCharacter(char)) {
            const digit = char <= CharCodes.NINE ? char - CharCodes.ZERO : (char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10;
            result = result * 16 + digit;
            consumed += 1;
            offset += 1;
          } else {
            this.result = result;
            this.consumed = consumed;
            return this.emitNumericEntity(char, 3);
          }
        }
        this.result = result;
        this.consumed = consumed;
        return -1;
      }
      /**
       * Parses a decimal numeric entity.
       *
       * Equivalent to the `Decimal character reference state` in the HTML
       * spec. Digit parsing matches the decimal loop in `parseNumericEntity`.
       * The accumulated value is preserved for numeric validation callbacks.
       * @param input The string containing the entity (or a continuation of the entity).
       * @param offset The current offset.
       * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
       */
      stateNumericDecimal(input, offset) {
        const inputLength = input.length;
        let { result } = this;
        let { consumed } = this;
        while (offset < inputLength) {
          const digit = input.charCodeAt(offset) - CharCodes.ZERO;
          if (digit >>> 0 > 9) {
            this.result = result;
            this.consumed = consumed;
            return this.emitNumericEntity(digit + CharCodes.ZERO, 2);
          }
          result = result * 10 + digit;
          consumed += 1;
          offset += 1;
        }
        this.result = result;
        this.consumed = consumed;
        return -1;
      }
      /**
       * Validate and emit a numeric entity.
       *
       * Implements the logic from the `Hexademical character reference start
       * state` and `Numeric character reference end state` in the HTML spec.
       * @param lastCp The last code point of the entity. Used to see if the
       *               entity was terminated with a semicolon.
       * @param expectedLength The minimum number of characters that should be
       *                       consumed. Used to validate that at least one digit
       *                       was consumed.
       * @returns The number of characters that were consumed.
       */
      emitNumericEntity(lastCp, expectedLength) {
        if (this.consumed <= expectedLength) {
          this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed);
          return 0;
        }
        if (lastCp === CharCodes.SEMI) {
          this.consumed += 1;
        } else if (this.decodeMode === DecodingMode.Strict) {
          return 0;
        }
        this.emitCodePoint((this.decodeTree === xmlDecodeTree ? replaceCodePointXML : replaceCodePoint)(this.result), this.consumed);
        if (this.errors) {
          if (lastCp !== CharCodes.SEMI) {
            this.errors.missingSemicolonAfterCharacterReference();
          }
          this.errors.validateNumericCharacterReference(this.result);
        }
        return this.consumed;
      }
      /**
       * Flush locally-tracked walk state back to the fields, then emit the
       * recorded legacy match or reject (cold path — at most once per
       * entity). Called after failed navigation (leaf node, branch miss, or
       * compact-run mismatch). In attribute mode, reject if no legacy was
       * recorded at the current node, if we descended past it, or if the
       * pending input character is an invalid attribute terminator.
       * @param consumed Locally-tracked consumed count.
       * @param excess Locally-tracked excess count.
       * @param char Pending input character (may be the mismatching char).
       * @param valueLength Value length at the current trie node.
       */
      flushAndEmitLegacyOrReject(consumed, excess, char, valueLength) {
        this.consumed = consumed;
        this.excess = excess;
        return this.result === 0 || this.decodeMode === DecodingMode.Attribute && (valueLength === 0 || excess > 1 || isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
      }
      /**
       * Parses a named entity.
       *
       * Equivalent to the `Named character reference state` in the HTML spec.
       * @param input The string containing the entity (or a continuation of the entity).
       * @param offset The current offset.
       * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
       */
      stateNamedEntity(input, offset) {
        const { decodeTree } = this;
        const inputLength = input.length;
        const isStrict = this.decodeMode === DecodingMode.Strict;
        let { treeIndex } = this;
        let { excess } = this;
        let { consumed } = this;
        let current = decodeTree[treeIndex];
        while (offset < inputLength) {
          while ((current & (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) === 0 && (current & BinTrieFlags.JUMP_TABLE) !== 0) {
            const char2 = input.charCodeAt(offset);
            const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
            const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
            if (branchCount === 0) {
              if (char2 !== jumpOffset) {
                return this.flushAndEmitLegacyOrReject(consumed, excess, char2, 0);
              }
              treeIndex += 1;
            } else {
              const slot = char2 - jumpOffset;
              if (slot >>> 0 >= branchCount) {
                return this.flushAndEmitLegacyOrReject(consumed, excess, char2, 0);
              }
              const stored = decodeTree[treeIndex + 1 + slot];
              if (stored === 0) {
                return this.flushAndEmitLegacyOrReject(consumed, excess, char2, 0);
              }
              treeIndex = treeIndex + branchCount + stored & 65535;
            }
            current = decodeTree[treeIndex];
            offset += 1;
            excess += 1;
            if (offset >= inputLength)
              break;
          }
          if (offset >= inputLength)
            break;
          if ((current & (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) === BinTrieFlags.FLAG13) {
            const runLength = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
            let { runConsumed } = this;
            if (runConsumed === 0) {
              const char2 = input.charCodeAt(offset);
              if (char2 !== (current & BinTrieFlags.JUMP_TABLE)) {
                return this.flushAndEmitLegacyOrReject(consumed, excess, char2, 0);
              }
              offset += 1;
              excess += 1;
              runConsumed = 1;
            }
            while (runConsumed < runLength) {
              if (offset >= inputLength) {
                this.treeIndex = treeIndex;
                this.excess = excess;
                this.consumed = consumed;
                this.runConsumed = runConsumed;
                return -1;
              }
              const charIndexInPacked = runConsumed - 1;
              const packedWord = decodeTree[treeIndex + 1 + (charIndexInPacked >> 1)];
              const expectedChar = packedWord >> ((charIndexInPacked & 1) << 3) & 255;
              const char2 = input.charCodeAt(offset);
              if (char2 !== expectedChar) {
                this.runConsumed = 0;
                return this.flushAndEmitLegacyOrReject(consumed, excess, char2, 0);
              }
              offset += 1;
              excess += 1;
              runConsumed += 1;
            }
            this.runConsumed = 0;
            treeIndex += 1 + (runLength >> 1);
            current = decodeTree[treeIndex];
            continue;
          }
          const valueLength = current >>> 14;
          const char = input.charCodeAt(offset);
          if (valueLength !== 0) {
            if (!isStrict && (current & BinTrieFlags.FLAG13) === 0) {
              this.result = treeIndex;
              consumed += excess - 1;
              excess = 1;
            }
            if (char === CharCodes.SEMI) {
              return this.emitNamedEntityData(treeIndex, valueLength, consumed + excess);
            }
            if (valueLength === 1) {
              return this.flushAndEmitLegacyOrReject(consumed, excess, char, valueLength);
            }
          }
          const next = determineBranch(decodeTree, current, treeIndex + (valueLength || 1), char);
          if (next < 0) {
            return this.flushAndEmitLegacyOrReject(consumed, excess, char, valueLength);
          }
          treeIndex = next;
          current = decodeTree[treeIndex];
          offset += 1;
          excess += 1;
        }
        if (!isStrict && current >>> 14 !== 0 && (current & BinTrieFlags.FLAG13) === 0) {
          this.result = treeIndex;
          consumed += excess - 1;
          excess = 1;
        }
        this.treeIndex = treeIndex;
        this.excess = excess;
        this.consumed = consumed;
        return -1;
      }
      /**
       * Emit a named entity that was not terminated with a semicolon.
       * @returns The number of characters consumed.
       */
      emitNotTerminatedNamedEntity() {
        const { result, decodeTree } = this;
        const valueLength = decodeTree[result] >>> 14;
        this.emitNamedEntityData(result, valueLength, this.consumed);
        this.errors?.missingSemicolonAfterCharacterReference();
        return this.consumed;
      }
      /**
       * Emit a named entity.
       * @param result The index of the entity in the decode tree.
       * @param valueLength Encoded value length (header plus any value words).
       * @param consumed The number of characters consumed.
       * @returns The number of characters consumed.
       */
      emitNamedEntityData(result, valueLength, consumed) {
        const { decodeTree } = this;
        this.emitCodePoint(valueLength === 1 ? decodeTree[result] & BinTrieFlags.VALUE_MASK : decodeTree[result + 1], consumed);
        if (valueLength === 3) {
          this.emitCodePoint(decodeTree[result + 2], consumed);
        }
        return consumed;
      }
      /**
       * Signal to the parser that the end of the input was reached.
       *
       * Remaining data will be emitted and relevant errors will be produced.
       * @returns The number of characters consumed.
       */
      end() {
        switch (this.state) {
          case EntityDecoderState.NamedEntity: {
            return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
          }
          // Otherwise, emit a numeric entity if we have one.
          case EntityDecoderState.NumericDecimal: {
            return this.emitNumericEntity(0, 2);
          }
          case EntityDecoderState.NumericHex: {
            return this.emitNumericEntity(0, 3);
          }
          case EntityDecoderState.NumericStart: {
            this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed);
            return 0;
          }
          default: {
            return 0;
          }
        }
      }
    };
  }
});

// node_modules/htmlparser2/dist/Tokenizer.js
function isWhitespace(c) {
  return c === CharCodes2.Space || c === CharCodes2.NewLine || c === CharCodes2.Tab || c === CharCodes2.FormFeed || c === CharCodes2.CarriageReturn;
}
function isEndOfTagSection(c) {
  return c === CharCodes2.Slash || c === CharCodes2.Gt || isWhitespace(c);
}
function isASCIIAlpha(c) {
  return c >= CharCodes2.LowerA && c <= CharCodes2.LowerZ || c >= CharCodes2.UpperA && c <= CharCodes2.UpperZ;
}
var CharCodes2, State, QuoteType, Sequences, specialStartSequences, Tokenizer;
var init_Tokenizer = __esm({
  "node_modules/htmlparser2/dist/Tokenizer.js"() {
    init_decode();
    (function(CharCodes3) {
      CharCodes3[CharCodes3["Tab"] = 9] = "Tab";
      CharCodes3[CharCodes3["NewLine"] = 10] = "NewLine";
      CharCodes3[CharCodes3["FormFeed"] = 12] = "FormFeed";
      CharCodes3[CharCodes3["CarriageReturn"] = 13] = "CarriageReturn";
      CharCodes3[CharCodes3["Space"] = 32] = "Space";
      CharCodes3[CharCodes3["ExclamationMark"] = 33] = "ExclamationMark";
      CharCodes3[CharCodes3["Number"] = 35] = "Number";
      CharCodes3[CharCodes3["Amp"] = 38] = "Amp";
      CharCodes3[CharCodes3["SingleQuote"] = 39] = "SingleQuote";
      CharCodes3[CharCodes3["DoubleQuote"] = 34] = "DoubleQuote";
      CharCodes3[CharCodes3["Dash"] = 45] = "Dash";
      CharCodes3[CharCodes3["Slash"] = 47] = "Slash";
      CharCodes3[CharCodes3["Zero"] = 48] = "Zero";
      CharCodes3[CharCodes3["Nine"] = 57] = "Nine";
      CharCodes3[CharCodes3["Semi"] = 59] = "Semi";
      CharCodes3[CharCodes3["Lt"] = 60] = "Lt";
      CharCodes3[CharCodes3["Eq"] = 61] = "Eq";
      CharCodes3[CharCodes3["Gt"] = 62] = "Gt";
      CharCodes3[CharCodes3["Questionmark"] = 63] = "Questionmark";
      CharCodes3[CharCodes3["UpperA"] = 65] = "UpperA";
      CharCodes3[CharCodes3["LowerA"] = 97] = "LowerA";
      CharCodes3[CharCodes3["UpperF"] = 70] = "UpperF";
      CharCodes3[CharCodes3["LowerF"] = 102] = "LowerF";
      CharCodes3[CharCodes3["UpperZ"] = 90] = "UpperZ";
      CharCodes3[CharCodes3["LowerZ"] = 122] = "LowerZ";
      CharCodes3[CharCodes3["LowerX"] = 120] = "LowerX";
      CharCodes3[CharCodes3["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
    })(CharCodes2 || (CharCodes2 = {}));
    (function(State2) {
      State2[State2["Text"] = 1] = "Text";
      State2[State2["BeforeTagName"] = 2] = "BeforeTagName";
      State2[State2["InTagName"] = 3] = "InTagName";
      State2[State2["InSelfClosingTag"] = 4] = "InSelfClosingTag";
      State2[State2["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
      State2[State2["InClosingTagName"] = 6] = "InClosingTagName";
      State2[State2["AfterClosingTagName"] = 7] = "AfterClosingTagName";
      State2[State2["BeforeAttributeName"] = 8] = "BeforeAttributeName";
      State2[State2["InAttributeName"] = 9] = "InAttributeName";
      State2[State2["AfterAttributeName"] = 10] = "AfterAttributeName";
      State2[State2["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
      State2[State2["InAttributeValueDq"] = 12] = "InAttributeValueDq";
      State2[State2["InAttributeValueSq"] = 13] = "InAttributeValueSq";
      State2[State2["InAttributeValueNq"] = 14] = "InAttributeValueNq";
      State2[State2["BeforeDeclaration"] = 15] = "BeforeDeclaration";
      State2[State2["InDeclaration"] = 16] = "InDeclaration";
      State2[State2["InProcessingInstruction"] = 17] = "InProcessingInstruction";
      State2[State2["BeforeComment"] = 18] = "BeforeComment";
      State2[State2["CDATASequence"] = 19] = "CDATASequence";
      State2[State2["DeclarationSequence"] = 20] = "DeclarationSequence";
      State2[State2["InSpecialComment"] = 21] = "InSpecialComment";
      State2[State2["InCommentLike"] = 22] = "InCommentLike";
      State2[State2["SpecialStartSequence"] = 23] = "SpecialStartSequence";
      State2[State2["InSpecialTag"] = 24] = "InSpecialTag";
      State2[State2["InPlainText"] = 25] = "InPlainText";
      State2[State2["InEntity"] = 26] = "InEntity";
    })(State || (State = {}));
    (function(QuoteType2) {
      QuoteType2[QuoteType2["NoValue"] = 0] = "NoValue";
      QuoteType2[QuoteType2["Unquoted"] = 1] = "Unquoted";
      QuoteType2[QuoteType2["Single"] = 2] = "Single";
      QuoteType2[QuoteType2["Double"] = 3] = "Double";
    })(QuoteType || (QuoteType = {}));
    Sequences = {
      Empty: new Uint8Array(0),
      Cdata: new Uint8Array([67, 68, 65, 84, 65, 91]),
      // CDATA[
      CdataEnd: new Uint8Array([93, 93, 62]),
      // ]]>
      CommentEnd: new Uint8Array([45, 45, 33, 62]),
      // `--!>`
      Doctype: new Uint8Array([100, 111, 99, 116, 121, 112, 101]),
      // `doctype`
      IframeEnd: new Uint8Array([60, 47, 105, 102, 114, 97, 109, 101]),
      // `</iframe`
      NoembedEnd: new Uint8Array([
        60,
        47,
        110,
        111,
        101,
        109,
        98,
        101,
        100
      ]),
      // `</noembed`
      NoframesEnd: new Uint8Array([
        60,
        47,
        110,
        111,
        102,
        114,
        97,
        109,
        101,
        115
      ]),
      // `</noframes`
      Plaintext: new Uint8Array([
        60,
        47,
        112,
        108,
        97,
        105,
        110,
        116,
        101,
        120,
        116
      ]),
      // `</plaintext`
      ScriptEnd: new Uint8Array([60, 47, 115, 99, 114, 105, 112, 116]),
      // `</script`
      StyleEnd: new Uint8Array([60, 47, 115, 116, 121, 108, 101]),
      // `</style`
      TitleEnd: new Uint8Array([60, 47, 116, 105, 116, 108, 101]),
      // `</title`
      TextareaEnd: new Uint8Array([
        60,
        47,
        116,
        101,
        120,
        116,
        97,
        114,
        101,
        97
      ]),
      // `</textarea`
      XmpEnd: new Uint8Array([60, 47, 120, 109, 112])
      // `</xmp`
    };
    specialStartSequences = /* @__PURE__ */ new Map([
      [Sequences.IframeEnd[2], Sequences.IframeEnd],
      [Sequences.NoembedEnd[2], Sequences.NoembedEnd],
      [Sequences.Plaintext[2], Sequences.Plaintext],
      [Sequences.ScriptEnd[2], Sequences.ScriptEnd],
      [Sequences.TitleEnd[2], Sequences.TitleEnd],
      [Sequences.XmpEnd[2], Sequences.XmpEnd]
    ]);
    Tokenizer = class {
      cbs;
      /** The current state the tokenizer is in. */
      state = State.Text;
      /** The read buffer. */
      buffer = "";
      /** The beginning of the section that is currently being read. */
      sectionStart = 0;
      /** The index within the buffer that we are currently looking at. */
      index = 0;
      /** The start of the last entity. */
      entityStart = 0;
      /** Some behavior, eg. when decoding entities, is done while we are in another state. This keeps track of the other state type. */
      baseState = State.Text;
      /** For special parsing behavior inside of script and style tags. */
      isSpecial = false;
      /** Indicates whether the tokenizer has been paused. */
      running = true;
      /** The offset of the current buffer. */
      offset = 0;
      xmlMode;
      decodeEntities;
      recognizeSelfClosing;
      entityDecoder;
      constructor({ xmlMode = false, decodeEntities = true, recognizeSelfClosing = xmlMode }, cbs) {
        this.cbs = cbs;
        this.xmlMode = xmlMode;
        this.decodeEntities = decodeEntities;
        this.recognizeSelfClosing = recognizeSelfClosing;
        this.entityDecoder = new EntityDecoder(xmlMode ? xmlDecodeTree : htmlDecodeTree, (cp, consumed) => this.emitCodePoint(cp, consumed));
      }
      reset() {
        this.state = State.Text;
        this.buffer = "";
        this.sectionStart = 0;
        this.index = 0;
        this.baseState = State.Text;
        this.isSpecial = false;
        this.currentSequence = Sequences.Empty;
        this.sequenceIndex = 0;
        this.running = true;
        this.offset = 0;
      }
      write(chunk) {
        this.offset += this.buffer.length;
        this.buffer = chunk;
        this.parse();
      }
      end() {
        if (this.running)
          this.finish();
      }
      pause() {
        this.running = false;
      }
      resume() {
        this.running = true;
        if (this.index < this.buffer.length + this.offset) {
          this.parse();
        }
      }
      stateText(c) {
        if (c === CharCodes2.Lt || !this.decodeEntities && this.fastForwardTo(CharCodes2.Lt)) {
          if (this.index > this.sectionStart) {
            this.cbs.ontext(this.sectionStart, this.index);
          }
          this.state = State.BeforeTagName;
          this.sectionStart = this.index;
        } else if (this.decodeEntities && c === CharCodes2.Amp) {
          this.startEntity();
        }
      }
      currentSequence = Sequences.Empty;
      sequenceIndex = 0;
      enterTagBody() {
        if (this.currentSequence === Sequences.Plaintext) {
          this.currentSequence = Sequences.Empty;
          this.state = State.InPlainText;
        } else if (this.isSpecial) {
          this.state = State.InSpecialTag;
          this.sequenceIndex = 0;
        } else {
          this.state = State.Text;
        }
      }
      /**
       * Match the opening tag name against an HTML text-only tag sequence.
       *
       * Some tags share an initial prefix (`script`/`style`, `title`/`textarea`,
       * `noembed`/`noframes`), so we may switch to an alternate sequence at the
       * first distinguishing byte.  On a successful full match we fall back to
       * the normal tag-name state; a later `>` will enter raw-text, RCDATA, or
       * plaintext mode based on `currentSequence` / `isSpecial`.
       * @param c Current character code point.
       */
      stateSpecialStartSequence(c) {
        const lower = c | 32;
        if (this.sequenceIndex < this.currentSequence.length) {
          if (lower === this.currentSequence[this.sequenceIndex]) {
            this.sequenceIndex++;
            return;
          }
          if (this.sequenceIndex === 3) {
            if (this.currentSequence === Sequences.ScriptEnd && lower === Sequences.StyleEnd[3]) {
              this.currentSequence = Sequences.StyleEnd;
              this.sequenceIndex = 4;
              return;
            }
            if (this.currentSequence === Sequences.TitleEnd && lower === Sequences.TextareaEnd[3]) {
              this.currentSequence = Sequences.TextareaEnd;
              this.sequenceIndex = 4;
              return;
            }
          } else if (this.sequenceIndex === 4 && this.currentSequence === Sequences.NoembedEnd && lower === Sequences.NoframesEnd[4]) {
            this.currentSequence = Sequences.NoframesEnd;
            this.sequenceIndex = 5;
            return;
          }
        } else if (isEndOfTagSection(c)) {
          this.sequenceIndex = 0;
          this.state = State.InTagName;
          this.stateInTagName(c);
          return;
        }
        this.isSpecial = false;
        this.currentSequence = Sequences.Empty;
        this.sequenceIndex = 0;
        this.state = State.InTagName;
        this.stateInTagName(c);
      }
      stateCDATASequence(c) {
        if (c === Sequences.Cdata[this.sequenceIndex]) {
          if (++this.sequenceIndex === Sequences.Cdata.length) {
            this.state = State.InCommentLike;
            this.currentSequence = Sequences.CdataEnd;
            this.sequenceIndex = 0;
            this.sectionStart = this.index + 1;
          }
        } else {
          this.sequenceIndex = 0;
          if (this.xmlMode) {
            this.state = State.InDeclaration;
            this.stateInDeclaration(c);
          } else {
            this.state = State.InSpecialComment;
            this.stateInSpecialComment(c);
          }
        }
      }
      /**
       * When we wait for one specific character, we can speed things up
       * by skipping through the buffer until we find it.
       * @param c Current character code point.
       * @returns Whether the character was found.
       */
      fastForwardTo(c) {
        while (++this.index < this.buffer.length + this.offset) {
          if (this.buffer.charCodeAt(this.index - this.offset) === c) {
            return true;
          }
        }
        this.index = this.buffer.length + this.offset - 1;
        return false;
      }
      /**
       * Emit a comment token and return to the text state.
       * @param offset Number of characters in the end sequence that have already been matched.
       */
      emitComment(offset) {
        this.cbs.oncomment(this.sectionStart, this.index, offset);
        this.sequenceIndex = 0;
        this.sectionStart = this.index + 1;
        this.state = State.Text;
      }
      /**
       * Comments and CDATA end with `-->` and `]]>`.
       *
       * Their common qualities are:
       * - Their end sequences have a distinct character they start with.
       * - That character is then repeated, so we have to check multiple repeats.
       * - All characters but the start character of the sequence can be skipped.
       * @param c Current character code point.
       */
      stateInCommentLike(c) {
        if (!this.xmlMode && this.currentSequence === Sequences.CommentEnd && this.sequenceIndex <= 1 && /*
         * We're still at the very start of the comment: the only
         * characters consumed since `<!--` are the dashes that
         * advanced sequenceIndex (0 for `<!-->`, 1 for `<!--->`).
         */
        this.index === this.sectionStart + this.sequenceIndex && c === CharCodes2.Gt) {
          this.emitComment(this.sequenceIndex);
        } else if (this.currentSequence === Sequences.CommentEnd && this.sequenceIndex === 2 && c === CharCodes2.Gt) {
          this.emitComment(2);
        } else if (this.currentSequence === Sequences.CommentEnd && this.sequenceIndex === this.currentSequence.length - 1 && c !== CharCodes2.Gt) {
          this.sequenceIndex = Number(c === CharCodes2.Dash);
        } else if (c === this.currentSequence[this.sequenceIndex]) {
          if (++this.sequenceIndex === this.currentSequence.length) {
            if (this.currentSequence === Sequences.CdataEnd) {
              this.cbs.oncdata(this.sectionStart, this.index, 2);
            } else {
              this.cbs.oncomment(this.sectionStart, this.index, 3);
            }
            this.sequenceIndex = 0;
            this.sectionStart = this.index + 1;
            this.state = State.Text;
          }
        } else if (this.sequenceIndex === 0) {
          if (this.fastForwardTo(this.currentSequence[0])) {
            this.sequenceIndex = 1;
          }
        } else if (c !== this.currentSequence[this.sequenceIndex - 1]) {
          this.sequenceIndex = 0;
        }
      }
      /**
       * HTML only allows ASCII alpha characters (a-z and A-Z) at the beginning of a tag name.
       *
       * XML allows a lot more characters here (@see https://www.w3.org/TR/REC-xml/#NT-NameStartChar).
       * We allow anything that wouldn't end the tag.
       * @param c Current character code point.
       */
      isTagStartChar(c) {
        return this.xmlMode ? !isEndOfTagSection(c) : isASCIIAlpha(c);
      }
      /**
       * Scan raw-text / RCDATA content for the matching end tag.
       *
       * For RCDATA tags (`<title>`, `<textarea>`) entities are decoded inline.
       * For raw-text tags (`<script>`, `<style>`, etc.) we fast-forward to `<`.
       * @param c Current character code point.
       */
      stateInSpecialTag(c) {
        if (this.sequenceIndex === this.currentSequence.length) {
          if (isEndOfTagSection(c)) {
            const endOfText = this.index - this.currentSequence.length;
            if (this.sectionStart < endOfText) {
              const actualIndex = this.index;
              this.index = endOfText;
              this.cbs.ontext(this.sectionStart, endOfText);
              this.index = actualIndex;
            }
            this.isSpecial = false;
            this.sectionStart = endOfText + 2;
            this.stateInClosingTagName(c);
            return;
          }
          this.sequenceIndex = 0;
        }
        if ((c | 32) === this.currentSequence[this.sequenceIndex]) {
          this.sequenceIndex += 1;
        } else if (this.sequenceIndex === 0) {
          if (this.currentSequence === Sequences.TitleEnd || this.currentSequence === Sequences.TextareaEnd) {
            if (this.decodeEntities && c === CharCodes2.Amp) {
              this.startEntity();
            }
          } else if (this.fastForwardTo(CharCodes2.Lt)) {
            this.sequenceIndex = 1;
          }
        } else {
          this.sequenceIndex = Number(c === CharCodes2.Lt);
        }
      }
      stateBeforeTagName(c) {
        if (c === CharCodes2.ExclamationMark) {
          this.state = State.BeforeDeclaration;
          this.sectionStart = this.index + 1;
        } else if (c === CharCodes2.Questionmark) {
          if (this.xmlMode) {
            this.state = State.InProcessingInstruction;
            this.sequenceIndex = 0;
            this.sectionStart = this.index + 1;
          } else {
            this.state = State.InSpecialComment;
            this.sectionStart = this.index;
          }
        } else if (this.isTagStartChar(c)) {
          this.sectionStart = this.index;
          const special = this.xmlMode || this.cbs.isInForeignContext?.() ? void 0 : specialStartSequences.get(c | 32);
          if (special === void 0) {
            this.state = State.InTagName;
          } else {
            this.isSpecial = true;
            this.currentSequence = special;
            this.sequenceIndex = 3;
            this.state = State.SpecialStartSequence;
          }
        } else if (c === CharCodes2.Slash) {
          this.state = State.BeforeClosingTagName;
        } else {
          this.state = State.Text;
          this.stateText(c);
        }
      }
      stateInTagName(c) {
        if (isEndOfTagSection(c)) {
          this.cbs.onopentagname(this.sectionStart, this.index);
          this.sectionStart = -1;
          this.state = State.BeforeAttributeName;
          this.stateBeforeAttributeName(c);
        }
      }
      stateBeforeClosingTagName(c) {
        if (isWhitespace(c)) {
          if (this.xmlMode) {
          } else {
            this.state = State.InSpecialComment;
            this.sectionStart = this.index;
          }
        } else if (c === CharCodes2.Gt) {
          this.state = State.Text;
          if (!this.xmlMode) {
            this.sectionStart = this.index + 1;
          }
        } else {
          this.state = this.isTagStartChar(c) ? State.InClosingTagName : State.InSpecialComment;
          this.sectionStart = this.index;
        }
      }
      stateInClosingTagName(c) {
        if (isEndOfTagSection(c)) {
          this.cbs.onclosetag(this.sectionStart, this.index);
          this.sectionStart = -1;
          this.state = State.AfterClosingTagName;
          this.stateAfterClosingTagName(c);
        }
      }
      stateAfterClosingTagName(c) {
        if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
          this.state = State.Text;
          this.sectionStart = this.index + 1;
        }
      }
      stateBeforeAttributeName(c) {
        if (c === CharCodes2.Gt) {
          this.cbs.onopentagend(this.index);
          this.enterTagBody();
          this.sectionStart = this.index + 1;
        } else if (c === CharCodes2.Slash) {
          this.state = State.InSelfClosingTag;
        } else if (!isWhitespace(c)) {
          this.state = State.InAttributeName;
          this.sectionStart = this.index;
        }
      }
      /**
       * Handle `/` before `>` in an opening tag.
       *
       * In HTML mode, text-only tags ignore the self-closing flag and still enter
       * their raw-text/RCDATA/plaintext state unless self-closing tags are being
       * recognized. In XML mode, or for ordinary tags, the tokenizer returns to
       * regular text parsing after emitting the self-closing callback.
       * @param c Current character code point.
       */
      stateInSelfClosingTag(c) {
        if (c === CharCodes2.Gt) {
          this.cbs.onselfclosingtag(this.index);
          this.sectionStart = this.index + 1;
          if (!this.recognizeSelfClosing) {
            this.enterTagBody();
            return;
          }
          this.state = State.Text;
          this.isSpecial = false;
          this.currentSequence = Sequences.Empty;
        } else if (!isWhitespace(c)) {
          this.state = State.BeforeAttributeName;
          this.stateBeforeAttributeName(c);
        }
      }
      stateInAttributeName(c) {
        if (c === CharCodes2.Eq || isEndOfTagSection(c)) {
          this.cbs.onattribname(this.sectionStart, this.index);
          this.sectionStart = this.index;
          this.state = State.AfterAttributeName;
          this.stateAfterAttributeName(c);
        }
      }
      stateAfterAttributeName(c) {
        if (c === CharCodes2.Eq) {
          this.state = State.BeforeAttributeValue;
        } else if (c === CharCodes2.Slash || c === CharCodes2.Gt) {
          this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
          this.sectionStart = -1;
          this.state = State.BeforeAttributeName;
          this.stateBeforeAttributeName(c);
        } else if (!isWhitespace(c)) {
          this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
          this.state = State.InAttributeName;
          this.sectionStart = this.index;
        }
      }
      stateBeforeAttributeValue(c) {
        if (c === CharCodes2.DoubleQuote) {
          this.state = State.InAttributeValueDq;
          this.sectionStart = this.index + 1;
        } else if (c === CharCodes2.SingleQuote) {
          this.state = State.InAttributeValueSq;
          this.sectionStart = this.index + 1;
        } else if (!isWhitespace(c)) {
          this.sectionStart = this.index;
          this.state = State.InAttributeValueNq;
          this.stateInAttributeValueNoQuotes(c);
        }
      }
      handleInAttributeValue(c, quote) {
        if (c === quote || !this.decodeEntities && this.fastForwardTo(quote)) {
          this.cbs.onattribdata(this.sectionStart, this.index);
          this.sectionStart = -1;
          this.cbs.onattribend(quote === CharCodes2.DoubleQuote ? QuoteType.Double : QuoteType.Single, this.index + 1);
          this.state = State.BeforeAttributeName;
        } else if (this.decodeEntities && c === CharCodes2.Amp) {
          this.startEntity();
        }
      }
      stateInAttributeValueDoubleQuotes(c) {
        this.handleInAttributeValue(c, CharCodes2.DoubleQuote);
      }
      stateInAttributeValueSingleQuotes(c) {
        this.handleInAttributeValue(c, CharCodes2.SingleQuote);
      }
      stateInAttributeValueNoQuotes(c) {
        if (isWhitespace(c) || c === CharCodes2.Gt) {
          this.cbs.onattribdata(this.sectionStart, this.index);
          this.sectionStart = -1;
          this.cbs.onattribend(QuoteType.Unquoted, this.index);
          this.state = State.BeforeAttributeName;
          this.stateBeforeAttributeName(c);
        } else if (this.decodeEntities && c === CharCodes2.Amp) {
          this.startEntity();
        }
      }
      /**
       * Distinguish between CDATA, declarations, HTML comments, and HTML bogus
       * comments after `<!`.
       *
       * In HTML mode, only real comments and doctypes stay on declaration paths;
       * everything else becomes a bogus comment terminated by the next `>`.
       * @param c Current character code point.
       */
      stateBeforeDeclaration(c) {
        if (c === CharCodes2.OpeningSquareBracket) {
          this.state = State.CDATASequence;
          this.sequenceIndex = 0;
        } else if (this.xmlMode) {
          this.state = c === CharCodes2.Dash ? State.BeforeComment : State.InDeclaration;
        } else if ((c | 32) === Sequences.Doctype[0]) {
          this.state = State.DeclarationSequence;
          this.currentSequence = Sequences.Doctype;
          this.sequenceIndex = 1;
        } else if (c === CharCodes2.Gt) {
          this.cbs.oncomment(this.sectionStart, this.index, 0);
          this.state = State.Text;
          this.sectionStart = this.index + 1;
        } else if (c === CharCodes2.Dash) {
          this.state = State.BeforeComment;
        } else {
          this.state = State.InSpecialComment;
        }
      }
      /**
       * Continue matching `doctype` after `<!d`.
       *
       * A full `doctype` match stays on the declaration path; any other name falls
       * back to an HTML bogus comment, which matches browser behavior for
       * non-doctype `<!...>` constructs.
       * @param c Current character code point.
       */
      stateDeclarationSequence(c) {
        if (this.sequenceIndex === this.currentSequence.length) {
          this.state = State.InDeclaration;
          this.stateInDeclaration(c);
        } else if ((c | 32) === this.currentSequence[this.sequenceIndex]) {
          this.sequenceIndex += 1;
        } else if (c === CharCodes2.Gt) {
          this.cbs.oncomment(this.sectionStart, this.index, 0);
          this.state = State.Text;
          this.sectionStart = this.index + 1;
        } else {
          this.state = State.InSpecialComment;
        }
      }
      stateInDeclaration(c) {
        if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
          this.cbs.ondeclaration(this.sectionStart, this.index);
          this.state = State.Text;
          this.sectionStart = this.index + 1;
        }
      }
      /**
       * XML processing instructions (`<?...?>`).
       *
       * In HTML mode `<?` is routed to `InSpecialComment` instead, so this
       * state is only reachable in XML mode.
       * @param c Current character code point.
       */
      stateInProcessingInstruction(c) {
        if (c === CharCodes2.Questionmark) {
          this.sequenceIndex = 1;
        } else if (c === CharCodes2.Gt && this.sequenceIndex === 1) {
          this.cbs.onprocessinginstruction(this.sectionStart, this.index - 1);
          this.sequenceIndex = 0;
          this.state = State.Text;
          this.sectionStart = this.index + 1;
        } else {
          this.sequenceIndex = Number(this.fastForwardTo(CharCodes2.Questionmark));
        }
      }
      stateBeforeComment(c) {
        if (c === CharCodes2.Dash) {
          this.state = State.InCommentLike;
          this.currentSequence = Sequences.CommentEnd;
          this.sequenceIndex = 0;
          this.sectionStart = this.index + 1;
        } else if (this.xmlMode) {
          this.state = State.InDeclaration;
        } else if (c === CharCodes2.Gt) {
          this.cbs.oncomment(this.sectionStart, this.index, 0);
          this.state = State.Text;
          this.sectionStart = this.index + 1;
        } else {
          this.state = State.InSpecialComment;
        }
      }
      stateInSpecialComment(c) {
        if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
          this.cbs.oncomment(this.sectionStart, this.index, 0);
          this.state = State.Text;
          this.sectionStart = this.index + 1;
        }
      }
      startEntity() {
        this.baseState = this.state;
        this.state = State.InEntity;
        this.entityStart = this.index;
        this.entityDecoder.startEntity(this.xmlMode ? DecodingMode.Strict : this.baseState === State.Text || this.baseState === State.InSpecialTag ? DecodingMode.Legacy : DecodingMode.Attribute);
      }
      stateInEntity() {
        const indexInBuffer = this.index - this.offset;
        const length = this.entityDecoder.write(this.buffer, indexInBuffer);
        if (length >= 0) {
          this.state = this.baseState;
          if (length === 0) {
            this.index -= 1;
          }
        } else {
          if (indexInBuffer < this.buffer.length && this.buffer.charCodeAt(indexInBuffer) === CharCodes2.Amp) {
            this.state = this.baseState;
            this.index -= 1;
            return;
          }
          this.index = this.offset + this.buffer.length - 1;
        }
      }
      /**
       * Remove data that has already been consumed from the buffer.
       */
      cleanup() {
        if (this.running && this.sectionStart !== this.index) {
          if (this.state === State.Text || this.state === State.InPlainText || this.state === State.InSpecialTag && this.sequenceIndex === 0) {
            this.cbs.ontext(this.sectionStart, this.index);
            this.sectionStart = this.index;
          } else if (this.state === State.InAttributeValueDq || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueNq) {
            this.cbs.onattribdata(this.sectionStart, this.index);
            this.sectionStart = this.index;
          }
        }
      }
      shouldContinue() {
        return this.index < this.buffer.length + this.offset && this.running;
      }
      /**
       * Iterates through the buffer, calling the function corresponding to the current state.
       *
       * States that are more likely to be hit are higher up, as a performance improvement.
       */
      parse() {
        while (this.shouldContinue()) {
          const c = this.buffer.charCodeAt(this.index - this.offset);
          switch (this.state) {
            case State.Text: {
              this.stateText(c);
              break;
            }
            case State.InPlainText: {
              this.index = this.buffer.length + this.offset - 1;
              break;
            }
            case State.SpecialStartSequence: {
              this.stateSpecialStartSequence(c);
              break;
            }
            case State.InSpecialTag: {
              this.stateInSpecialTag(c);
              break;
            }
            case State.CDATASequence: {
              this.stateCDATASequence(c);
              break;
            }
            case State.DeclarationSequence: {
              this.stateDeclarationSequence(c);
              break;
            }
            case State.InAttributeValueDq: {
              this.stateInAttributeValueDoubleQuotes(c);
              break;
            }
            case State.InAttributeName: {
              this.stateInAttributeName(c);
              break;
            }
            case State.InCommentLike: {
              this.stateInCommentLike(c);
              break;
            }
            case State.InSpecialComment: {
              this.stateInSpecialComment(c);
              break;
            }
            case State.BeforeAttributeName: {
              this.stateBeforeAttributeName(c);
              break;
            }
            case State.InTagName: {
              this.stateInTagName(c);
              break;
            }
            case State.InClosingTagName: {
              this.stateInClosingTagName(c);
              break;
            }
            case State.BeforeTagName: {
              this.stateBeforeTagName(c);
              break;
            }
            case State.AfterAttributeName: {
              this.stateAfterAttributeName(c);
              break;
            }
            case State.InAttributeValueSq: {
              this.stateInAttributeValueSingleQuotes(c);
              break;
            }
            case State.BeforeAttributeValue: {
              this.stateBeforeAttributeValue(c);
              break;
            }
            case State.BeforeClosingTagName: {
              this.stateBeforeClosingTagName(c);
              break;
            }
            case State.AfterClosingTagName: {
              this.stateAfterClosingTagName(c);
              break;
            }
            case State.InAttributeValueNq: {
              this.stateInAttributeValueNoQuotes(c);
              break;
            }
            case State.InSelfClosingTag: {
              this.stateInSelfClosingTag(c);
              break;
            }
            case State.InDeclaration: {
              this.stateInDeclaration(c);
              break;
            }
            case State.BeforeDeclaration: {
              this.stateBeforeDeclaration(c);
              break;
            }
            case State.BeforeComment: {
              this.stateBeforeComment(c);
              break;
            }
            case State.InProcessingInstruction: {
              this.stateInProcessingInstruction(c);
              break;
            }
            case State.InEntity: {
              this.stateInEntity();
              break;
            }
          }
          this.index++;
        }
        this.cleanup();
      }
      finish() {
        if (this.state === State.InEntity) {
          this.entityDecoder.end();
          this.state = this.baseState;
        }
        this.handleTrailingData();
        this.cbs.onend();
      }
      handleTrailingCommentLikeData(endIndex) {
        if (this.state !== State.InCommentLike) {
          return false;
        }
        if (this.currentSequence === Sequences.CdataEnd) {
          if (this.xmlMode) {
            if (this.sectionStart < endIndex) {
              this.cbs.oncdata(this.sectionStart, endIndex, 0);
            }
          } else {
            const cdataStart = this.sectionStart - Sequences.Cdata.length - 1;
            this.cbs.oncomment(cdataStart, endIndex, 0);
          }
        } else {
          const offset = this.xmlMode ? 0 : Math.min(this.sequenceIndex, Sequences.CommentEnd.length - 1);
          this.cbs.oncomment(this.sectionStart, endIndex, offset);
        }
        return true;
      }
      handleTrailingMarkupDeclaration(endIndex) {
        if (this.xmlMode) {
          switch (this.state) {
            case State.InSpecialComment:
            case State.BeforeComment:
            case State.CDATASequence:
            case State.DeclarationSequence:
            case State.InDeclaration: {
              this.cbs.ontext(this.sectionStart, endIndex);
              return true;
            }
            default: {
              return false;
            }
          }
        }
        switch (this.state) {
          case State.BeforeDeclaration:
          case State.InSpecialComment:
          case State.BeforeComment:
          case State.CDATASequence: {
            this.cbs.oncomment(this.sectionStart, endIndex, 0);
            return true;
          }
          case State.DeclarationSequence: {
            if (this.sequenceIndex !== Sequences.Doctype.length) {
              this.cbs.oncomment(this.sectionStart, endIndex, 0);
            }
            return true;
          }
          case State.InDeclaration: {
            return true;
          }
          default: {
            return false;
          }
        }
      }
      /** Handle any trailing data. */
      handleTrailingData() {
        const endIndex = this.buffer.length + this.offset;
        if (this.handleTrailingCommentLikeData(endIndex) || this.handleTrailingMarkupDeclaration(endIndex)) {
          return;
        }
        if (this.sectionStart >= endIndex) {
          return;
        }
        switch (this.state) {
          case State.InTagName:
          case State.BeforeAttributeName:
          case State.BeforeAttributeValue:
          case State.AfterAttributeName:
          case State.InAttributeName:
          case State.InAttributeValueSq:
          case State.InAttributeValueDq:
          case State.InAttributeValueNq:
          case State.InClosingTagName: {
            break;
          }
          default: {
            this.cbs.ontext(this.sectionStart, endIndex);
          }
        }
      }
      emitCodePoint(cp, consumed) {
        if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) {
          if (this.sectionStart < this.entityStart) {
            this.cbs.onattribdata(this.sectionStart, this.entityStart);
          }
          this.sectionStart = this.entityStart + consumed;
          this.index = this.sectionStart - 1;
          this.cbs.onattribentity(cp);
        } else {
          if (this.sectionStart < this.entityStart) {
            this.cbs.ontext(this.sectionStart, this.entityStart);
          }
          this.sectionStart = this.entityStart + consumed;
          this.index = this.sectionStart - 1;
          this.cbs.ontextentity(cp, this.sectionStart);
        }
      }
    };
  }
});

// node_modules/htmlparser2/dist/Parser.js
var fromCodePoint, formTags, pTag, headingTags, tableSectionTags, ddtTags, rtpTags, openImpliesClose, DOCUMENT_TYPE, voidElements, foreignContextElements, htmlIntegrationElements, svgTagNameAdjustments, ForeignContext, reNameEnd, Parser;
var init_Parser = __esm({
  "node_modules/htmlparser2/dist/Parser.js"() {
    init_Tokenizer();
    ({ fromCodePoint } = String);
    formTags = /* @__PURE__ */ new Set([
      "input",
      "option",
      "optgroup",
      "select",
      "button",
      "datalist",
      "textarea"
    ]);
    pTag = /* @__PURE__ */ new Set(["p"]);
    headingTags = /* @__PURE__ */ new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p"]);
    tableSectionTags = /* @__PURE__ */ new Set(["thead", "tbody"]);
    ddtTags = /* @__PURE__ */ new Set(["dd", "dt"]);
    rtpTags = /* @__PURE__ */ new Set(["rt", "rp"]);
    openImpliesClose = /* @__PURE__ */ new Map([
      ["tr", /* @__PURE__ */ new Set(["tr", "th", "td"])],
      ["th", /* @__PURE__ */ new Set(["th"])],
      ["td", /* @__PURE__ */ new Set(["thead", "th", "td"])],
      ["body", /* @__PURE__ */ new Set(["head", "link", "script"])],
      ["a", /* @__PURE__ */ new Set(["a"])],
      ["li", /* @__PURE__ */ new Set(["li"])],
      ["p", pTag],
      ["h1", headingTags],
      ["h2", headingTags],
      ["h3", headingTags],
      ["h4", headingTags],
      ["h5", headingTags],
      ["h6", headingTags],
      ["select", formTags],
      ["input", formTags],
      ["output", formTags],
      ["button", formTags],
      ["datalist", formTags],
      ["textarea", formTags],
      ["option", /* @__PURE__ */ new Set(["option"])],
      ["optgroup", /* @__PURE__ */ new Set(["optgroup", "option"])],
      ["dd", ddtTags],
      ["dt", ddtTags],
      ["address", pTag],
      ["article", pTag],
      ["aside", pTag],
      ["blockquote", pTag],
      ["details", pTag],
      ["div", pTag],
      ["dl", pTag],
      ["fieldset", pTag],
      ["figcaption", pTag],
      ["figure", pTag],
      ["footer", pTag],
      ["form", pTag],
      ["header", pTag],
      ["hr", pTag],
      ["main", pTag],
      ["nav", pTag],
      ["ol", pTag],
      ["pre", pTag],
      ["section", pTag],
      ["table", pTag],
      ["ul", pTag],
      ["rt", rtpTags],
      ["rp", rtpTags],
      ["tbody", tableSectionTags],
      ["tfoot", tableSectionTags]
    ]);
    DOCUMENT_TYPE = "doctype";
    voidElements = /* @__PURE__ */ new Set([
      "area",
      "base",
      "basefont",
      "br",
      "col",
      "command",
      "embed",
      "frame",
      "hr",
      "img",
      "input",
      "isindex",
      "keygen",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr"
    ]);
    foreignContextElements = /* @__PURE__ */ new Set(["math", "svg"]);
    htmlIntegrationElements = /* @__PURE__ */ new Set([
      "mi",
      "mo",
      "mn",
      "ms",
      "mtext",
      "annotation-xml",
      "foreignObject",
      "desc",
      "title"
    ]);
    svgTagNameAdjustments = /* @__PURE__ */ new Map([
      ["altglyph", "altGlyph"],
      ["altglyphdef", "altGlyphDef"],
      ["altglyphitem", "altGlyphItem"],
      ["animatecolor", "animateColor"],
      ["animatemotion", "animateMotion"],
      ["animatetransform", "animateTransform"],
      ["clippath", "clipPath"],
      ["feblend", "feBlend"],
      ["fecolormatrix", "feColorMatrix"],
      ["fecomponenttransfer", "feComponentTransfer"],
      ["fecomposite", "feComposite"],
      ["feconvolvematrix", "feConvolveMatrix"],
      ["fediffuselighting", "feDiffuseLighting"],
      ["fedisplacementmap", "feDisplacementMap"],
      ["fedistantlight", "feDistantLight"],
      ["fedropshadow", "feDropShadow"],
      ["feflood", "feFlood"],
      ["fefunca", "feFuncA"],
      ["fefuncb", "feFuncB"],
      ["fefuncg", "feFuncG"],
      ["fefuncr", "feFuncR"],
      ["fegaussianblur", "feGaussianBlur"],
      ["feimage", "feImage"],
      ["femerge", "feMerge"],
      ["femergenode", "feMergeNode"],
      ["femorphology", "feMorphology"],
      ["feoffset", "feOffset"],
      ["fepointlight", "fePointLight"],
      ["fespecularlighting", "feSpecularLighting"],
      ["fespotlight", "feSpotLight"],
      ["fetile", "feTile"],
      ["feturbulence", "feTurbulence"],
      ["foreignobject", "foreignObject"],
      ["glyphref", "glyphRef"],
      ["lineargradient", "linearGradient"],
      ["radialgradient", "radialGradient"],
      ["textpath", "textPath"]
    ]);
    (function(ForeignContext2) {
      ForeignContext2[ForeignContext2["None"] = 0] = "None";
      ForeignContext2[ForeignContext2["Svg"] = 1] = "Svg";
      ForeignContext2[ForeignContext2["MathML"] = 2] = "MathML";
    })(ForeignContext || (ForeignContext = {}));
    reNameEnd = /\s|\//;
    Parser = class {
      options;
      /** The start index of the last event. */
      startIndex = 0;
      /** The end index of the last event. */
      endIndex = 0;
      /**
       * Store the start index of the current open tag,
       * so we can update the start index for attributes.
       */
      openTagStart = 0;
      tagname = "";
      attribname = "";
      attribvalue = "";
      attribs = null;
      stack = [];
      foreignContext;
      cbs;
      lowerCaseTagNames;
      lowerCaseAttributeNames;
      recognizeSelfClosing;
      /** We are parsing HTML. Inverse of the `xmlMode` option. */
      htmlMode;
      tokenizer;
      buffers = [];
      bufferOffset = 0;
      /** The index of the last written buffer. Used when resuming after a `pause()`. */
      writeIndex = 0;
      /** Indicates whether the parser has finished running / `.end` has been called. */
      ended = false;
      constructor(cbs, options = {}) {
        this.options = options;
        this.cbs = cbs ?? {};
        this.htmlMode = !this.options.xmlMode;
        this.lowerCaseTagNames = options.lowerCaseTags ?? this.htmlMode;
        this.lowerCaseAttributeNames = options.lowerCaseAttributeNames ?? this.htmlMode;
        this.recognizeSelfClosing = options.recognizeSelfClosing ?? !this.htmlMode;
        this.tokenizer = new (options.Tokenizer ?? Tokenizer)(this.options, this);
        this.foreignContext = [ForeignContext.None];
        this.cbs.onparserinit?.(this);
      }
      // Tokenizer event handlers
      /**
       * @param start Start index for the current parser event.
       * @param endIndex End index for the current parser event.
       * @internal
       */
      ontext(start, endIndex) {
        const data = this.getSlice(start, endIndex);
        this.endIndex = endIndex - 1;
        this.cbs.ontext?.(data);
        this.startIndex = endIndex;
      }
      /**
       * @param cp Current Unicode code point.
       * @param endIndex End index for the current parser event.
       * @internal
       */
      ontextentity(cp, endIndex) {
        this.endIndex = endIndex - 1;
        this.cbs.ontext?.(fromCodePoint(cp));
        this.startIndex = endIndex;
      }
      /** @internal */
      isInForeignContext() {
        return this.foreignContext[0] !== ForeignContext.None;
      }
      /**
       * Checks if the current tag is a void element. Override this if you want
       * to specify your own additional void elements.
       * @param name Name of the pseudo selector.
       */
      isVoidElement(name) {
        return this.htmlMode && voidElements.has(name);
      }
      /**
       * Read a tag name from the buffer.
       *
       * When `lowerCaseTagNames` is enabled (the default in HTML mode), the name
       * is lowercased and may be adjusted for SVG casing or the `image` → `img`
       * alias.
       * @param start Start index of the tag name in the buffer.
       * @param endIndex End index of the tag name in the buffer.
       */
      readTagName(start, endIndex) {
        const name = this.lowerCaseTagNames ? this.getSlice(start, endIndex).toLowerCase() : this.getSlice(start, endIndex);
        if (!(this.lowerCaseTagNames && this.htmlMode)) {
          return name;
        }
        if (this.foreignContext[0] === ForeignContext.Svg) {
          return svgTagNameAdjustments.get(name) ?? name;
        }
        if (this.foreignContext.length > 1) {
          const adjusted = svgTagNameAdjustments.get(name);
          if (adjusted !== void 0 && this.stack.includes(adjusted)) {
            return adjusted;
          }
        }
        if (!this.isInForeignContext()) {
          return name === "image" ? "img" : name;
        }
        return name;
      }
      /**
       * @param start Start index for the current parser event.
       * @param endIndex End index for the current parser event.
       * @internal
       */
      onopentagname(start, endIndex) {
        this.endIndex = endIndex;
        this.emitOpenTag(this.readTagName(start, endIndex));
      }
      emitOpenTag(name) {
        this.openTagStart = this.startIndex;
        this.tagname = name;
        if (this.htmlMode && name === "form" && this.stack.includes("form")) {
          this.tagname = "";
          return;
        }
        const impliesClose = this.htmlMode && openImpliesClose.get(name);
        if (impliesClose) {
          while (this.stack.length > 0 && impliesClose.has(this.stack[0])) {
            this.popElement(true);
          }
        }
        if (!this.isVoidElement(name)) {
          this.stack.unshift(name);
          if (this.htmlMode) {
            if (name === "svg") {
              this.foreignContext.unshift(ForeignContext.Svg);
            } else if (name === "math") {
              this.foreignContext.unshift(ForeignContext.MathML);
            } else if (htmlIntegrationElements.has(name)) {
              this.foreignContext.unshift(ForeignContext.None);
            }
          }
        }
        this.cbs.onopentagname?.(name);
        if (this.cbs.onopentag)
          this.attribs = {};
      }
      endOpenTag(isImplied) {
        this.startIndex = this.openTagStart;
        if (this.attribs) {
          this.cbs.onopentag?.(this.tagname, this.attribs, isImplied);
          this.attribs = null;
        }
        if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) {
          this.cbs.onclosetag(this.tagname, true);
        }
        this.tagname = "";
      }
      /**
       * @param endIndex End index for the current parser event.
       * @internal
       */
      onopentagend(endIndex) {
        this.endIndex = endIndex;
        this.endOpenTag(false);
        this.startIndex = endIndex + 1;
      }
      /**
       * @param start Start index for the current parser event.
       * @param endIndex End index for the current parser event.
       * @internal
       */
      onclosetag(start, endIndex) {
        this.endIndex = endIndex;
        const name = this.readTagName(start, endIndex);
        if (!this.isVoidElement(name)) {
          const pos = this.stack.indexOf(name);
          if (pos !== -1) {
            for (let index = 0; index < pos; index++) {
              this.popElement(true);
            }
            this.popElement(false);
          } else if (this.htmlMode && name === "p") {
            this.emitOpenTag("p");
            this.closeCurrentTag(true);
          }
        } else if (this.htmlMode && name === "br") {
          this.cbs.onopentagname?.("br");
          this.cbs.onopentag?.("br", {}, true);
          this.cbs.onclosetag?.("br", false);
        }
        this.startIndex = endIndex + 1;
      }
      /**
       * @param endIndex End index for the current parser event.
       * @internal
       */
      onselfclosingtag(endIndex) {
        this.endIndex = endIndex;
        if (this.recognizeSelfClosing || this.isInForeignContext()) {
          this.closeCurrentTag(false);
          this.startIndex = endIndex + 1;
        } else {
          this.onopentagend(endIndex);
        }
      }
      /**
       * Pop the top element off the stack, emit a close event, and maintain
       * the foreign context stack.
       * @param implied Whether this close is implied (not from an explicit end tag).
       */
      popElement(implied) {
        const element = this.stack.shift();
        if (this.htmlMode && (foreignContextElements.has(element) || htmlIntegrationElements.has(element))) {
          this.foreignContext.shift();
        }
        this.cbs.onclosetag?.(element, implied);
      }
      closeCurrentTag(isOpenImplied) {
        const name = this.tagname;
        this.endOpenTag(isOpenImplied);
        if (this.stack[0] === name) {
          this.popElement(!isOpenImplied);
        }
      }
      /**
       * @param start Start index for the current parser event.
       * @param endIndex End index for the current parser event.
       * @internal
       */
      onattribname(start, endIndex) {
        this.startIndex = start;
        const name = this.getSlice(start, endIndex);
        this.attribname = this.lowerCaseAttributeNames ? name.toLowerCase() : name;
      }
      /**
       * @param start Start index for the current parser event.
       * @param endIndex End index for the current parser event.
       * @internal
       */
      onattribdata(start, endIndex) {
        this.attribvalue += this.getSlice(start, endIndex);
      }
      /**
       * @param cp Current Unicode code point.
       * @internal
       */
      onattribentity(cp) {
        this.attribvalue += fromCodePoint(cp);
      }
      /**
       * @param quote Quote type used for the current attribute.
       * @param endIndex End index for the current parser event.
       * @internal
       */
      onattribend(quote, endIndex) {
        this.endIndex = endIndex;
        this.cbs.onattribute?.(this.attribname, this.attribvalue, quote === QuoteType.Double ? '"' : quote === QuoteType.Single ? "'" : quote === QuoteType.NoValue ? void 0 : null);
        if (this.attribs && !Object.hasOwn(this.attribs, this.attribname)) {
          this.attribs[this.attribname] = this.attribvalue;
        }
        this.attribvalue = "";
      }
      getInstructionName(value) {
        const index = value.search(reNameEnd);
        let name = index < 0 ? value : value.substr(0, index);
        if (this.lowerCaseTagNames) {
          name = name.toLowerCase();
        }
        return name;
      }
      /**
       * @param start Start index for the current parser event.
       * @param endIndex End index for the current parser event.
       * @internal
       */
      ondeclaration(start, endIndex) {
        this.endIndex = endIndex;
        const value = this.getSlice(start, endIndex);
        if (this.cbs.onprocessinginstruction) {
          const name = this.htmlMode ? this.lowerCaseTagNames ? DOCUMENT_TYPE : value.slice(0, DOCUMENT_TYPE.length) : this.getInstructionName(value);
          this.cbs.onprocessinginstruction(`!${name}`, `!${value}`);
        }
        this.startIndex = endIndex + 1;
      }
      /**
       * @param start Start index for the current parser event.
       * @param endIndex End index for the current parser event.
       * @internal
       */
      onprocessinginstruction(start, endIndex) {
        this.endIndex = endIndex;
        const value = this.getSlice(start, endIndex);
        if (this.cbs.onprocessinginstruction) {
          const name = this.getInstructionName(value);
          this.cbs.onprocessinginstruction(`?${name}`, `?${value}`);
        }
        this.startIndex = endIndex + 1;
      }
      /**
       * @param start Start index for the current parser event.
       * @param endIndex End index for the current parser event.
       * @param offset Offset applied when computing parser indices.
       * @internal
       */
      oncomment(start, endIndex, offset) {
        this.endIndex = endIndex;
        this.cbs.oncomment?.(this.getSlice(start, endIndex - offset));
        this.cbs.oncommentend?.();
        this.startIndex = endIndex + 1;
      }
      /**
       * @param start Start index for the current parser event.
       * @param endIndex End index for the current parser event.
       * @param offset Offset applied when computing parser indices.
       * @internal
       */
      oncdata(start, endIndex, offset) {
        this.endIndex = endIndex;
        const value = this.getSlice(start, endIndex - offset);
        if (!this.htmlMode || this.options.recognizeCDATA) {
          this.cbs.oncdatastart?.();
          this.cbs.ontext?.(value);
          this.cbs.oncdataend?.();
        } else if (this.isInForeignContext()) {
          this.cbs.ontext?.(value);
        } else {
          this.cbs.oncomment?.(`[CDATA[${value}]]`);
          this.cbs.oncommentend?.();
        }
        this.startIndex = endIndex + 1;
      }
      /** @internal */
      onend() {
        if (this.cbs.onclosetag) {
          this.endIndex = this.startIndex;
          for (let index = 0; index < this.stack.length; index++) {
            this.cbs.onclosetag(this.stack[index], true);
          }
        }
        this.cbs.onend?.();
      }
      /**
       * Resets the parser to a blank state, ready to parse a new HTML document
       */
      reset() {
        this.cbs.onreset?.();
        this.tokenizer.reset();
        this.tagname = "";
        this.attribname = "";
        this.attribvalue = "";
        this.attribs = null;
        this.stack.length = 0;
        this.startIndex = 0;
        this.endIndex = 0;
        this.cbs.onparserinit?.(this);
        this.buffers.length = 0;
        this.foreignContext.length = 0;
        this.foreignContext.unshift(ForeignContext.None);
        this.bufferOffset = 0;
        this.writeIndex = 0;
        this.ended = false;
      }
      /**
       * Resets the parser, then parses a complete document and
       * pushes it to the handler.
       * @param data Document to parse.
       */
      parseComplete(data) {
        this.reset();
        this.end(data);
      }
      getSlice(start, end) {
        if (start === end) {
          return "";
        }
        while (start - this.bufferOffset >= this.buffers[0].length) {
          this.shiftBuffer();
        }
        let slice = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
        while (end - this.bufferOffset > this.buffers[0].length) {
          this.shiftBuffer();
          slice += this.buffers[0].slice(0, end - this.bufferOffset);
        }
        return slice;
      }
      shiftBuffer() {
        this.bufferOffset += this.buffers[0].length;
        this.writeIndex--;
        this.buffers.shift();
      }
      /**
       * Parses a chunk of data and calls the corresponding callbacks.
       * @param chunk Chunk to parse.
       */
      write(chunk) {
        if (this.ended) {
          this.cbs.onerror?.(new Error(".write() after done!"));
          return;
        }
        this.buffers.push(chunk);
        if (this.tokenizer.running) {
          this.tokenizer.write(chunk);
          this.writeIndex++;
        }
      }
      /**
       * Parses the end of the buffer and clears the stack, calls onend.
       * @param chunk Optional final chunk to parse.
       */
      end(chunk) {
        if (this.ended) {
          this.cbs.onerror?.(new Error(".end() after done!"));
          return;
        }
        if (chunk)
          this.write(chunk);
        this.ended = true;
        this.tokenizer.end();
      }
      /**
       * Pauses parsing. The parser won't emit events until `resume` is called.
       */
      pause() {
        this.tokenizer.pause();
      }
      /**
       * Resumes parsing after `pause` was called.
       */
      resume() {
        this.tokenizer.resume();
        while (this.tokenizer.running && this.writeIndex < this.buffers.length) {
          this.tokenizer.write(this.buffers[this.writeIndex++]);
        }
        if (this.ended)
          this.tokenizer.end();
      }
    };
  }
});

// node_modules/domelementtype/dist/index.js
var dist_exports = {};
__export(dist_exports, {
  CDATA: () => CDATA,
  Comment: () => Comment,
  Directive: () => Directive,
  Doctype: () => Doctype,
  ElementType: () => ElementType,
  Root: () => Root,
  Script: () => Script,
  Style: () => Style,
  Tag: () => Tag,
  Text: () => Text,
  isTag: () => isTag
});
function isTag(element) {
  return element.type === ElementType.Tag || element.type === ElementType.Script || element.type === ElementType.Style;
}
var ElementType, Root, Text, Directive, Comment, Script, Style, Tag, CDATA, Doctype;
var init_dist = __esm({
  "node_modules/domelementtype/dist/index.js"() {
    (function(ElementType2) {
      ElementType2["Root"] = "root";
      ElementType2["Text"] = "text";
      ElementType2["Directive"] = "directive";
      ElementType2["Comment"] = "comment";
      ElementType2["Script"] = "script";
      ElementType2["Style"] = "style";
      ElementType2["Tag"] = "tag";
      ElementType2["CDATA"] = "cdata";
      ElementType2["Doctype"] = "doctype";
    })(ElementType || (ElementType = {}));
    Root = ElementType.Root;
    Text = ElementType.Text;
    Directive = ElementType.Directive;
    Comment = ElementType.Comment;
    Script = ElementType.Script;
    Style = ElementType.Style;
    Tag = ElementType.Tag;
    CDATA = ElementType.CDATA;
    Doctype = ElementType.Doctype;
  }
});

// node_modules/domhandler/dist/node.js
function isTag2(node) {
  return isTag(node);
}
function isCDATA(node) {
  return node.type === ElementType.CDATA;
}
function isText(node) {
  return node.type === ElementType.Text;
}
function isComment(node) {
  return node.type === ElementType.Comment;
}
function isDirective(node) {
  return node.type === ElementType.Directive;
}
function isDocument(node) {
  return node.type === ElementType.Root;
}
function hasChildren(node) {
  return Object.hasOwn(node, "children");
}
function cloneNode(node, recursive = false) {
  let result;
  if (isText(node)) {
    result = new Text2(node.data);
  } else if (isComment(node)) {
    result = new Comment2(node.data);
  } else if (isTag2(node)) {
    const children = recursive ? cloneChildren(node.children) : [];
    const clone = new Element(node.name, { ...node.attribs }, children);
    for (const child of children) {
      child.parent = clone;
    }
    if (node.namespace != null) {
      clone.namespace = node.namespace;
    }
    if (node["x-attribsNamespace"]) {
      clone["x-attribsNamespace"] = { ...node["x-attribsNamespace"] };
    }
    if (node["x-attribsPrefix"]) {
      clone["x-attribsPrefix"] = { ...node["x-attribsPrefix"] };
    }
    result = clone;
  } else if (isCDATA(node)) {
    const children = recursive ? cloneChildren(node.children) : [];
    const clone = new CDATA2(children);
    for (const child of children) {
      child.parent = clone;
    }
    result = clone;
  } else if (isDocument(node)) {
    const children = recursive ? cloneChildren(node.children) : [];
    const clone = new Document(children);
    for (const child of children) {
      child.parent = clone;
    }
    if (node["x-mode"]) {
      clone["x-mode"] = node["x-mode"];
    }
    result = clone;
  } else if (isDirective(node)) {
    const instruction = new ProcessingInstruction(node.name, node.data);
    if (node["x-name"] != null) {
      instruction["x-name"] = node["x-name"];
      instruction["x-publicId"] = node["x-publicId"];
      instruction["x-systemId"] = node["x-systemId"];
    }
    result = instruction;
  } else {
    throw new Error(`Not implemented yet: ${node.type}`);
  }
  result.startIndex = node.startIndex;
  result.endIndex = node.endIndex;
  if (node.sourceCodeLocation != null) {
    result.sourceCodeLocation = node.sourceCodeLocation;
  }
  return result;
}
function cloneChildren(childs) {
  const children = childs.map((child) => cloneNode(child, true));
  for (let index = 1; index < children.length; index++) {
    children[index].prev = children[index - 1];
    children[index - 1].next = children[index];
  }
  return children;
}
var Node, DataNode, Text2, Comment2, ProcessingInstruction, NodeWithChildren, CDATA2, Document, Element;
var init_node = __esm({
  "node_modules/domhandler/dist/node.js"() {
    init_dist();
    Node = class {
      /** Parent of the node */
      parent = null;
      /** Previous sibling */
      prev = null;
      /** Next sibling */
      next = null;
      /** The start index of the node. Requires `withStartIndices` on the handler to be `true. */
      startIndex = null;
      /** The end index of the node. Requires `withEndIndices` on the handler to be `true. */
      endIndex = null;
      // Read-write aliases for properties
      /**
       * Same as {@link parent}.
       * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
       */
      get parentNode() {
        return this.parent;
      }
      set parentNode(parent) {
        this.parent = parent;
      }
      /**
       * Same as {@link prev}.
       * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
       */
      get previousSibling() {
        return this.prev;
      }
      set previousSibling(previous) {
        this.prev = previous;
      }
      /**
       * Same as {@link next}.
       * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
       */
      get nextSibling() {
        return this.next;
      }
      set nextSibling(next) {
        this.next = next;
      }
      /**
       * Clone this node, and optionally its children.
       * @param recursive Clone child nodes as well.
       * @returns A clone of the node.
       */
      cloneNode(recursive = false) {
        return cloneNode(this, recursive);
      }
    };
    DataNode = class extends Node {
      data;
      /**
       * @param data The content of the data node
       */
      constructor(data) {
        super();
        this.data = data;
      }
      /**
       * Same as {@link data}.
       * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
       */
      get nodeValue() {
        return this.data;
      }
      set nodeValue(data) {
        this.data = data;
      }
    };
    Text2 = class extends DataNode {
      type = ElementType.Text;
      get nodeType() {
        return 3;
      }
    };
    Comment2 = class extends DataNode {
      type = ElementType.Comment;
      get nodeType() {
        return 8;
      }
    };
    ProcessingInstruction = class extends DataNode {
      type = ElementType.Directive;
      name;
      constructor(name, data) {
        super(data);
        this.name = name;
      }
      get nodeType() {
        return 1;
      }
      /** If this is a doctype, the document type name (parse5 only). */
      "x-name";
      /** If this is a doctype, the document type public identifier (parse5 only). */
      "x-publicId";
      /** If this is a doctype, the document type system identifier (parse5 only). */
      "x-systemId";
    };
    NodeWithChildren = class extends Node {
      children;
      /**
       * @param children Children of the node. Only certain node types can have children.
       */
      constructor(children) {
        super();
        this.children = children;
      }
      // Aliases
      /** First child of the node. */
      get firstChild() {
        return this.children[0] ?? null;
      }
      /** Last child of the node. */
      get lastChild() {
        return this.children.length > 0 ? this.children[this.children.length - 1] : null;
      }
      /**
       * Same as {@link children}.
       * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
       */
      get childNodes() {
        return this.children;
      }
      set childNodes(children) {
        this.children = children;
      }
    };
    CDATA2 = class extends NodeWithChildren {
      type = ElementType.CDATA;
      get nodeType() {
        return 4;
      }
    };
    Document = class extends NodeWithChildren {
      type = ElementType.Root;
      get nodeType() {
        return 9;
      }
    };
    Element = class extends NodeWithChildren {
      name;
      attribs;
      type;
      /**
       * @param name Name of the tag, eg. `div`, `span`.
       * @param attribs Object mapping attribute names to attribute values.
       * @param children Children of the node.
       * @param type Node type used for the new node instance.
       */
      constructor(name, attribs, children = [], type = name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag) {
        super(children);
        this.name = name;
        this.attribs = attribs;
        this.type = type;
      }
      get nodeType() {
        return 1;
      }
      // DOM Level 1 aliases
      /**
       * Same as {@link name}.
       * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
       */
      get tagName() {
        return this.name;
      }
      set tagName(name) {
        this.name = name;
      }
      get attributes() {
        return Object.keys(this.attribs).map((name) => ({
          name,
          value: this.attribs[name],
          namespace: this["x-attribsNamespace"]?.[name],
          prefix: this["x-attribsPrefix"]?.[name]
        }));
      }
      /** Element namespace (parse5 only). */
      namespace;
      /** Element attribute namespaces (parse5 only). */
      "x-attribsNamespace";
      /** Element attribute namespace-related prefixes (parse5 only). */
      "x-attribsPrefix";
    };
  }
});

// node_modules/domhandler/dist/index.js
var defaultOptions, DomHandler;
var init_dist2 = __esm({
  "node_modules/domhandler/dist/index.js"() {
    init_dist();
    init_node();
    init_node();
    defaultOptions = {
      withStartIndices: false,
      withEndIndices: false,
      xmlMode: false
    };
    DomHandler = class {
      /** The elements of the DOM */
      dom = [];
      /** The root element for the DOM */
      root = new Document(this.dom);
      /** Called once parsing has completed. */
      callback;
      /** Settings for the handler. */
      options;
      /** Callback whenever a tag is closed. */
      elementCB;
      /** Indicated whether parsing has been completed. */
      done = false;
      /** Stack of open tags. */
      tagStack = [this.root];
      /** A data node that is still being written to. */
      lastNode = null;
      /** Reference to the parser instance. Used for location information. */
      parser = null;
      /**
       * @param callback Called once parsing has completed.
       * @param options Settings for the handler.
       * @param elementCB Callback whenever a tag is closed.
       */
      constructor(callback, options, elementCB) {
        if (typeof options === "function") {
          elementCB = options;
          options = defaultOptions;
        }
        if (typeof callback === "object") {
          options = callback;
          callback = void 0;
        }
        this.callback = callback ?? null;
        this.options = options ?? defaultOptions;
        this.elementCB = elementCB ?? null;
      }
      onparserinit(parser) {
        this.parser = parser;
      }
      // Resets the handler back to starting state
      onreset() {
        this.dom = [];
        this.root = new Document(this.dom);
        this.done = false;
        this.tagStack = [this.root];
        this.lastNode = null;
        this.parser = null;
      }
      // Signals the handler that parsing is done
      onend() {
        if (this.done)
          return;
        this.done = true;
        this.parser = null;
        this.handleCallback(null);
      }
      onerror(error) {
        this.handleCallback(error);
      }
      onclosetag() {
        this.lastNode = null;
        const element = this.tagStack.pop();
        if (this.options.withEndIndices && this.parser) {
          element.endIndex = this.parser.endIndex;
        }
        if (this.elementCB)
          this.elementCB(element);
      }
      onopentag(name, attribs) {
        const type = this.options.xmlMode ? ElementType.Tag : void 0;
        const element = new Element(name, attribs, void 0, type);
        this.addNode(element);
        this.tagStack.push(element);
      }
      ontext(data) {
        const { lastNode } = this;
        if (lastNode && lastNode.type === ElementType.Text) {
          lastNode.data += data;
          if (this.options.withEndIndices && this.parser) {
            lastNode.endIndex = this.parser.endIndex;
          }
        } else {
          const node = new Text2(data);
          this.addNode(node);
          this.lastNode = node;
        }
      }
      oncomment(data) {
        if (this.lastNode && this.lastNode.type === ElementType.Comment) {
          this.lastNode.data += data;
          return;
        }
        const node = new Comment2(data);
        this.addNode(node);
        this.lastNode = node;
      }
      oncommentend() {
        this.lastNode = null;
      }
      oncdatastart() {
        const text = new Text2("");
        const node = new CDATA2([text]);
        this.addNode(node);
        text.parent = node;
        this.lastNode = text;
      }
      oncdataend() {
        this.lastNode = null;
      }
      onprocessinginstruction(name, data) {
        const node = new ProcessingInstruction(name, data);
        this.addNode(node);
      }
      handleCallback(error) {
        if (typeof this.callback === "function") {
          this.callback(error, this.dom);
        } else if (error) {
          throw error;
        }
      }
      addNode(node) {
        const parent = this.tagStack[this.tagStack.length - 1];
        const previousSibling = parent.children[parent.children.length - 1];
        if (this.options.withStartIndices && this.parser) {
          node.startIndex = this.parser.startIndex;
        }
        if (this.options.withEndIndices && this.parser) {
          node.endIndex = this.parser.endIndex;
        }
        parent.children.push(node);
        if (previousSibling) {
          node.prev = previousSibling;
          previousSibling.next = node;
        }
        node.parent = parent;
        this.lastNode = null;
      }
    };
  }
});

// node_modules/domutils/dist/querying.js
function filter(test, node, recurse = true, limit = Number.POSITIVE_INFINITY) {
  return find(test, Array.isArray(node) ? node : [node], recurse, limit);
}
function find(test, nodes, recurse, limit) {
  const result = [];
  const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
  const indexStack = [0];
  for (; ; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (indexStack.length === 1) {
        return result;
      }
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const element = nodeStack[0][indexStack[0]++];
    if (test(element)) {
      result.push(element);
      if (--limit <= 0)
        return result;
    }
    if (recurse && hasChildren(element) && element.children.length > 0) {
      indexStack.unshift(0);
      nodeStack.unshift(element.children);
    }
  }
}
function findOne(test, nodes, recurse = true) {
  const searchedNodes = Array.isArray(nodes) ? nodes : [nodes];
  for (const node of searchedNodes) {
    if (isTag2(node) && test(node)) {
      return node;
    }
    if (recurse && hasChildren(node) && node.children.length > 0) {
      const found = findOne(test, node.children, true);
      if (found)
        return found;
    }
  }
  return null;
}
function existsOne(test, nodes) {
  return (Array.isArray(nodes) ? nodes : [nodes]).some((node) => isTag2(node) && test(node) || hasChildren(node) && existsOne(test, node.children));
}
function findAll(test, nodes) {
  const result = [];
  const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
  const indexStack = [0];
  for (; ; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (nodeStack.length === 1) {
        return result;
      }
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const element = nodeStack[0][indexStack[0]++];
    if (isTag2(element) && test(element))
      result.push(element);
    if (hasChildren(element) && element.children.length > 0) {
      indexStack.unshift(0);
      nodeStack.unshift(element.children);
    }
  }
}
var init_querying = __esm({
  "node_modules/domutils/dist/querying.js"() {
    init_dist2();
  }
});

// node_modules/domutils/dist/legacy.js
function getAttribCheck(attrib, value) {
  if (typeof value === "function") {
    return (element) => isTag2(element) && value(element.attribs[attrib]);
  }
  return (element) => isTag2(element) && element.attribs[attrib] === value;
}
function combineFuncs(a, b2) {
  return (element) => a(element) || b2(element);
}
function compileTest(options) {
  const funcs = Object.keys(options).map((key) => {
    const value = options[key];
    return Object.hasOwn(Checks, key) ? Checks[key](value) : getAttribCheck(key, value);
  });
  return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
}
function testElement(options, node) {
  const test = compileTest(options);
  return test ? test(node) : true;
}
function getElements(options, nodes, recurse, limit = Number.POSITIVE_INFINITY) {
  const test = compileTest(options);
  return test ? filter(test, nodes, recurse, limit) : [];
}
function getElementById(id, nodes, recurse = true) {
  if (!Array.isArray(nodes))
    nodes = [nodes];
  return findOne(getAttribCheck("id", id), nodes, recurse);
}
function getElementsByTagName(tagName, nodes, recurse = true, limit = Number.POSITIVE_INFINITY) {
  return filter(Checks["tag_name"](tagName), nodes, recurse, limit);
}
function getElementsByClassName(className, nodes, recurse = true, limit = Number.POSITIVE_INFINITY) {
  return filter(getAttribCheck("class", className), nodes, recurse, limit);
}
function getElementsByTagType(type, nodes, recurse = true, limit = Number.POSITIVE_INFINITY) {
  return filter(Checks["tag_type"](type), nodes, recurse, limit);
}
var Checks;
var init_legacy = __esm({
  "node_modules/domutils/dist/legacy.js"() {
    init_dist2();
    init_querying();
    Checks = {
      tag_name(name) {
        if (typeof name === "function") {
          return (element) => isTag2(element) && name(element.name);
        }
        if (name === "*") {
          return isTag2;
        }
        return (element) => isTag2(element) && element.name === name;
      },
      tag_type(type) {
        if (typeof type === "function") {
          return (element) => type(element.type);
        }
        return (element) => element.type === type;
      },
      tag_contains(data) {
        if (typeof data === "function") {
          return (element) => isText(element) && data(element.data);
        }
        return (element) => isText(element) && element.data === data;
      }
    };
  }
});

// node_modules/entities/dist/escape.js
function getEscape(char) {
  return char === 34 ? "&quot;" : char === 38 ? "&amp;" : char === 39 ? "&apos;" : char === 60 ? "&lt;" : char === 62 ? "&gt;" : "&nbsp;";
}
function isXmlEscapable(code) {
  return code >= 128 || code >= 32 && code < 64 && (XML_BITSET_VALUE >>> code & 1) === 1;
}
function encodeXML(input) {
  const { length } = input;
  let out;
  let last = 0;
  let index = 0;
  while (index < length) {
    const char = input.charCodeAt(index);
    if (!isXmlEscapable(char)) {
      const bound = Math.min(index + 32, length);
      let next = index + 1;
      while (next < bound && !isXmlEscapable(input.charCodeAt(next))) {
        next++;
      }
      if (next < bound) {
        index = next;
        continue;
      }
      if (next >= length)
        break;
      xmlEncodeRegex.lastIndex = next;
      if (!xmlEncodeRegex.test(input))
        break;
      index = xmlEncodeRegex.lastIndex - 1;
      continue;
    }
    if (out === void 0)
      out = input.substring(0, index);
    else if (last !== index)
      out += input.substring(last, index);
    if (char < 64) {
      out += getEscape(char);
      last = index += 1;
      continue;
    }
    const cp = input.codePointAt(index);
    out += `&#x${cp.toString(16)};`;
    if (cp !== char)
      index++;
    last = index += 1;
  }
  if (out === void 0)
    return input;
  if (last < length)
    out += input.substr(last);
  return out;
}
function escapeWithRegex(re, data) {
  re.lastIndex = 0;
  if (!re.test(data))
    return data;
  let out = "";
  let last = 0;
  do {
    const index = re.lastIndex - 1;
    if (last !== index)
      out += data.substring(last, index);
    const char = data.charCodeAt(index);
    out += getEscape(char);
    last = index + 1;
  } while (re.test(data));
  return out + data.substring(last);
}
function escapeAttribute(data) {
  return escapeWithRegex(attributeEscapeRegex, data);
}
function escapeText(data) {
  return escapeWithRegex(textEscapeRegex, data);
}
var XML_BITSET_VALUE, xmlEncodeRegex, attributeEscapeRegex, textEscapeRegex;
var init_escape = __esm({
  "node_modules/entities/dist/escape.js"() {
    XML_BITSET_VALUE = 1342177476;
    xmlEncodeRegex = /["&'<>\u0080-\uFFFF]/g;
    attributeEscapeRegex = /["&\u{A0}]/gu;
    textEscapeRegex = /[&<>\u{A0}]/gu;
  }
});

// node_modules/entities/dist/index.js
var EntityLevel, EncodingMode;
var init_dist3 = __esm({
  "node_modules/entities/dist/index.js"() {
    init_escape();
    (function(EntityLevel2) {
      EntityLevel2[EntityLevel2["XML"] = 0] = "XML";
      EntityLevel2[EntityLevel2["HTML"] = 1] = "HTML";
    })(EntityLevel || (EntityLevel = {}));
    (function(EncodingMode2) {
      EncodingMode2[EncodingMode2["UTF8"] = 0] = "UTF8";
      EncodingMode2[EncodingMode2["ASCII"] = 1] = "ASCII";
      EncodingMode2[EncodingMode2["Extensive"] = 2] = "Extensive";
      EncodingMode2[EncodingMode2["Attribute"] = 3] = "Attribute";
      EncodingMode2[EncodingMode2["Text"] = 4] = "Text";
    })(EncodingMode || (EncodingMode = {}));
  }
});

// node_modules/dom-serializer/dist/foreign-names.js
var elementNames, attributeNames;
var init_foreign_names = __esm({
  "node_modules/dom-serializer/dist/foreign-names.js"() {
    elementNames = new Map("altGlyph altGlyphDef altGlyphItem animateColor animateMotion animateTransform clipPath feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence foreignObject glyphRef linearGradient radialGradient textPath".split(" ").map((name) => [name.toLowerCase(), name]));
    attributeNames = new Map("definitionURL attributeName attributeType baseFrequency baseProfile calcMode clipPathUnits diffuseConstant edgeMode filterUnits glyphRef gradientTransform gradientUnits kernelMatrix kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle markerHeight markerUnits markerWidth maskContentUnits maskUnits numOctaves pathLength patternContentUnits patternTransform patternUnits pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY repeatCount repeatDur requiredExtensions requiredFeatures specularConstant specularExponent spreadMethod startOffset stdDeviation stitchTiles surfaceScale systemLanguage tableValues targetX targetY textLength viewBox viewTarget xChannelSelector yChannelSelector zoomAndPan".split(" ").map((name) => [name.toLowerCase(), name]));
  }
});

// node_modules/dom-serializer/dist/index.js
function render(node, options = {}) {
  const nodes = "length" in node ? node : [node];
  const xmlMode = options.xmlMode ?? false;
  let output = "";
  for (let index = 0; index < nodes.length; index++) {
    output += renderNode(nodes[index], options, xmlMode);
  }
  return output;
}
function renderChildren(children, options, xmlMode) {
  let output = "";
  for (let index = 0; index < children.length; index++) {
    output += renderNode(children[index], options, xmlMode);
  }
  return output;
}
function renderNode(node, options, xmlMode) {
  switch (node.type) {
    case Root: {
      return renderChildren(node.children, options, xmlMode);
    }
    case Directive: {
      return `<${node.data}>`;
    }
    case Comment: {
      return `<!--${node.data}-->`;
    }
    case CDATA: {
      return `<![CDATA[${node.children[0].data}]]>`;
    }
    case Script:
    case Style:
    case Tag: {
      return renderTag(node, options, xmlMode);
    }
    case Text: {
      const element = node;
      const data = element.data || "";
      if ((options.encodeEntities ?? options.decodeEntities) !== false && !(!xmlMode && element.parent && unencodedElements.has(element.parent.name))) {
        return xmlMode || options.encodeEntities !== "utf8" ? encodeXML(data) : escapeText(data);
      }
      return data;
    }
  }
}
function renderTag(element, options, xmlMode) {
  if (xmlMode === "foreign") {
    element.name = elementNames.get(element.name) ?? element.name;
    if (element.parent && foreignModeIntegrationPoints.has(element.parent.name)) {
      xmlMode = false;
    }
  }
  if (!xmlMode && foreignElements.has(element.name)) {
    xmlMode = "foreign";
  }
  const { name, children } = element;
  const isVoid = !xmlMode && voidElements2.has(name);
  let tag = `<${name}${formatAttributes(element.attribs, options, xmlMode)}`;
  if (children.length === 0 && (xmlMode ? options.selfClosingTags !== false : options.selfClosingTags && isVoid)) {
    tag += xmlMode ? "/>" : " />";
  } else {
    tag += ">";
    if (children.length > 0) {
      tag += renderChildren(children, options, xmlMode);
    }
    if (!isVoid) {
      tag += `</${name}>`;
    }
  }
  return tag;
}
function replaceQuotes(value) {
  return value.replaceAll('"', "&quot;");
}
function formatAttributes(attributes, options, xmlMode) {
  if (!attributes)
    return "";
  const encode = (options.encodeEntities ?? options.decodeEntities) === false ? replaceQuotes : xmlMode || options.encodeEntities !== "utf8" ? encodeXML : escapeAttribute;
  const isForeign = xmlMode === "foreign";
  const showEmpty = !!(options.emptyAttrs ?? xmlMode);
  let result = "";
  for (const key in attributes) {
    if (!Object.hasOwn(attributes, key))
      continue;
    const value = attributes[key];
    const k = isForeign ? attributeNames.get(key) ?? key : key;
    result += !showEmpty && (value == null || value === "") ? ` ${k}` : ` ${k}="${encode(value == null ? "" : String(value))}"`;
  }
  return result;
}
var unencodedElements, voidElements2, foreignElements, foreignModeIntegrationPoints, dist_default;
var init_dist4 = __esm({
  "node_modules/dom-serializer/dist/index.js"() {
    init_dist();
    init_dist3();
    init_foreign_names();
    unencodedElements = new Set("style script xmp iframe noembed noframes plaintext noscript".split(" "));
    voidElements2 = new Set("area base basefont br col command embed frame hr img input isindex keygen link meta param source track wbr".split(" "));
    foreignElements = /* @__PURE__ */ new Set(["svg", "math"]);
    foreignModeIntegrationPoints = new Set("mi mo mn ms mtext annotation-xml foreignObject desc title".split(" "));
    dist_default = render;
  }
});

// node_modules/domutils/dist/stringify.js
function getOuterHTML(node, options) {
  return dist_default(node, options);
}
function getInnerHTML(node, options) {
  return hasChildren(node) ? node.children.map((node2) => getOuterHTML(node2, options)).join("") : "";
}
function getText(node) {
  if (Array.isArray(node))
    return node.map(getText).join("");
  if (isTag2(node))
    return node.name === "br" ? "\n" : getText(node.children);
  if (isCDATA(node))
    return getText(node.children);
  if (isText(node))
    return node.data;
  return "";
}
function textContent(node) {
  if (Array.isArray(node))
    return node.map(textContent).join("");
  if (hasChildren(node) && !isComment(node)) {
    return textContent(node.children);
  }
  if (isText(node))
    return node.data;
  return "";
}
function innerText(node) {
  if (Array.isArray(node))
    return node.map(innerText).join("");
  if (hasChildren(node) && (node.type === ElementType.Tag || isCDATA(node))) {
    return innerText(node.children);
  }
  if (isText(node))
    return node.data;
  return "";
}
var init_stringify = __esm({
  "node_modules/domutils/dist/stringify.js"() {
    init_dist4();
    init_dist();
    init_dist2();
  }
});

// node_modules/domutils/dist/feeds.js
function getFeed(document2) {
  const feedRoot = getOneElement(isValidFeed, document2);
  return feedRoot ? feedRoot.name === "feed" ? getAtomFeed(feedRoot) : getRssFeed(feedRoot) : null;
}
function getAtomFeed(feedRoot) {
  const childs = feedRoot.children;
  const feed = {
    type: "atom",
    items: getElementsByTagName("entry", childs).map((item) => {
      const { children } = item;
      const entry2 = { media: getMediaElements(children) };
      addConditionally(entry2, "id", "id", children);
      addConditionally(entry2, "title", "title", children);
      const href2 = getOneElement("link", children)?.attribs["href"];
      if (href2) {
        entry2.link = href2;
      }
      const description = fetch2("summary", children) || fetch2("content", children);
      if (description) {
        entry2.description = description;
      }
      const pubDate = fetch2("updated", children);
      if (pubDate) {
        entry2.pubDate = new Date(pubDate);
      }
      return entry2;
    })
  };
  addConditionally(feed, "id", "id", childs);
  addConditionally(feed, "title", "title", childs);
  const href = getOneElement("link", childs)?.attribs["href"];
  if (href) {
    feed.link = href;
  }
  addConditionally(feed, "description", "subtitle", childs);
  const updated = fetch2("updated", childs);
  if (updated) {
    feed.updated = new Date(updated);
  }
  addConditionally(feed, "author", "email", childs, true);
  return feed;
}
function getRssFeed(feedRoot) {
  const childs = getOneElement("channel", feedRoot.children)?.children ?? [];
  const feed = {
    type: feedRoot.name.substr(0, 3),
    id: "",
    items: getElementsByTagName("item", feedRoot.children).map((item) => {
      const { children } = item;
      const entry2 = { media: getMediaElements(children) };
      addConditionally(entry2, "id", "guid", children);
      addConditionally(entry2, "title", "title", children);
      addConditionally(entry2, "link", "link", children);
      addConditionally(entry2, "description", "description", children);
      const pubDate = fetch2("pubDate", children) || fetch2("dc:date", children);
      if (pubDate)
        entry2.pubDate = new Date(pubDate);
      return entry2;
    })
  };
  addConditionally(feed, "title", "title", childs);
  addConditionally(feed, "link", "link", childs);
  addConditionally(feed, "description", "description", childs);
  const updated = fetch2("lastBuildDate", childs);
  if (updated) {
    feed.updated = new Date(updated);
  }
  addConditionally(feed, "author", "managingEditor", childs, true);
  return feed;
}
function getMediaElements(where) {
  return getElementsByTagName("media:content", where).map((element) => {
    const { attribs } = element;
    const media = {
      medium: attribs["medium"],
      isDefault: !!attribs["isDefault"]
    };
    for (const attrib of MEDIA_KEYS_STRING) {
      if (attribs[attrib]) {
        media[attrib] = attribs[attrib];
      }
    }
    for (const attrib of MEDIA_KEYS_INT) {
      if (attribs[attrib]) {
        media[attrib] = Number.parseInt(attribs[attrib], 10);
      }
    }
    if (attribs["expression"]) {
      media.expression = attribs["expression"];
    }
    return media;
  });
}
function getOneElement(tagName, node) {
  return getElementsByTagName(tagName, node, true, 1)[0];
}
function fetch2(tagName, where, recurse = false) {
  return textContent(getElementsByTagName(tagName, where, recurse, 1)).trim();
}
function addConditionally(object, property, tagName, where, recurse = false) {
  const value = fetch2(tagName, where, recurse);
  if (value)
    object[property] = value;
}
function isValidFeed(value) {
  return value === "rss" || value === "feed" || value === "rdf:RDF";
}
var MEDIA_KEYS_STRING, MEDIA_KEYS_INT;
var init_feeds = __esm({
  "node_modules/domutils/dist/feeds.js"() {
    init_legacy();
    init_stringify();
    MEDIA_KEYS_STRING = ["url", "type", "lang"];
    MEDIA_KEYS_INT = [
      "fileSize",
      "bitrate",
      "framerate",
      "samplingrate",
      "channels",
      "duration",
      "height",
      "width"
    ];
  }
});

// node_modules/domutils/dist/helpers.js
function removeSubsets(nodes) {
  let index = nodes.length;
  while (--index >= 0) {
    const node = nodes[index];
    if (index > 0 && nodes.lastIndexOf(node, index - 1) >= 0) {
      nodes.splice(index, 1);
      continue;
    }
    for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
      if (nodes.includes(ancestor)) {
        nodes.splice(index, 1);
        break;
      }
    }
  }
  return nodes;
}
function compareDocumentPosition(nodeA, nodeB) {
  const aParents = [];
  const bParents = [];
  if (nodeA === nodeB) {
    return 0;
  }
  let current = hasChildren(nodeA) ? nodeA : nodeA.parent;
  while (current) {
    aParents.unshift(current);
    current = current.parent;
  }
  current = hasChildren(nodeB) ? nodeB : nodeB.parent;
  while (current) {
    bParents.unshift(current);
    current = current.parent;
  }
  const maxIndex = Math.min(aParents.length, bParents.length);
  let index = 0;
  while (index < maxIndex && aParents[index] === bParents[index]) {
    index++;
  }
  if (index === 0) {
    return DocumentPosition.DISCONNECTED;
  }
  const sharedParent = aParents[index - 1];
  const siblings = sharedParent.children;
  const aSibling = aParents[index];
  const bSibling = bParents[index];
  if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
    if (sharedParent === nodeB) {
      return DocumentPosition.FOLLOWING | DocumentPosition.CONTAINED_BY;
    }
    return DocumentPosition.FOLLOWING;
  }
  if (sharedParent === nodeA) {
    return DocumentPosition.PRECEDING | DocumentPosition.CONTAINS;
  }
  return DocumentPosition.PRECEDING;
}
function uniqueSort(nodes) {
  nodes = nodes.filter((node, index, array) => !array.includes(node, index + 1));
  nodes.sort((a, b2) => {
    const relative = compareDocumentPosition(a, b2);
    if (relative & DocumentPosition.PRECEDING) {
      return -1;
    }
    if (relative & DocumentPosition.FOLLOWING) {
      return 1;
    }
    return 0;
  });
  return nodes;
}
var DocumentPosition;
var init_helpers = __esm({
  "node_modules/domutils/dist/helpers.js"() {
    init_dist2();
    (function(DocumentPosition2) {
      DocumentPosition2[DocumentPosition2["DISCONNECTED"] = 1] = "DISCONNECTED";
      DocumentPosition2[DocumentPosition2["PRECEDING"] = 2] = "PRECEDING";
      DocumentPosition2[DocumentPosition2["FOLLOWING"] = 4] = "FOLLOWING";
      DocumentPosition2[DocumentPosition2["CONTAINS"] = 8] = "CONTAINS";
      DocumentPosition2[DocumentPosition2["CONTAINED_BY"] = 16] = "CONTAINED_BY";
    })(DocumentPosition || (DocumentPosition = {}));
  }
});

// node_modules/domutils/dist/manipulation.js
function removeElement(element) {
  if (element.prev)
    element.prev.next = element.next;
  if (element.next)
    element.next.prev = element.prev;
  if (element.parent) {
    const childs = element.parent.children;
    const childsIndex = childs.lastIndexOf(element);
    if (childsIndex !== -1) {
      childs.splice(childsIndex, 1);
    }
  }
  element.next = null;
  element.prev = null;
  element.parent = null;
}
function replaceElement(element, replacement) {
  replacement.prev = element.prev;
  if (replacement.prev) {
    replacement.prev.next = replacement;
  }
  replacement.next = element.next;
  if (replacement.next) {
    replacement.next.prev = replacement;
  }
  replacement.parent = element.parent;
  if (replacement.parent) {
    const { children } = replacement.parent;
    const elementIndex = children.lastIndexOf(element);
    if (elementIndex === -1) {
      return;
    }
    children[elementIndex] = replacement;
    element.parent = null;
  }
}
function appendChild(parent, child) {
  removeElement(child);
  child.next = null;
  child.parent = parent;
  if (parent.children.push(child) > 1) {
    const sibling = parent.children[parent.children.length - 2];
    sibling.next = child;
    child.prev = sibling;
  } else {
    child.prev = null;
  }
}
function append(element, next) {
  removeElement(next);
  const { parent } = element;
  const currentNext = element.next;
  next.next = currentNext;
  next.prev = element;
  element.next = next;
  next.parent = parent;
  if (currentNext) {
    currentNext.prev = next;
    if (parent) {
      const childs = parent.children;
      childs.splice(childs.lastIndexOf(currentNext), 0, next);
    }
  } else if (parent) {
    parent.children.push(next);
  }
}
function prependChild(parent, child) {
  removeElement(child);
  child.parent = parent;
  child.prev = null;
  if (parent.children.unshift(child) === 1) {
    child.next = null;
  } else {
    const sibling = parent.children[1];
    sibling.prev = child;
    child.next = sibling;
  }
}
function prepend(element, previous) {
  removeElement(previous);
  const { parent } = element;
  if (parent) {
    const childs = parent.children;
    childs.splice(childs.indexOf(element), 0, previous);
  }
  if (element.prev) {
    element.prev.next = previous;
  }
  previous.parent = parent;
  previous.prev = element.prev;
  previous.next = element;
  element.prev = previous;
}
var init_manipulation = __esm({
  "node_modules/domutils/dist/manipulation.js"() {
  }
});

// node_modules/domutils/dist/traversal.js
function getChildren(element) {
  return hasChildren(element) ? element.children : [];
}
function getParent(element) {
  return element.parent || null;
}
function getSiblings(element) {
  const parent = getParent(element);
  if (parent != null)
    return getChildren(parent);
  const siblings = [element];
  let { prev, next } = element;
  while (prev != null) {
    siblings.unshift(prev);
    ({ prev } = prev);
  }
  while (next != null) {
    siblings.push(next);
    ({ next } = next);
  }
  return siblings;
}
function getAttributeValue(element, name) {
  const { attribs } = element;
  return attribs?.[name];
}
function hasAttrib(element, name) {
  const { attribs } = element;
  return attribs != null && Object.hasOwn(attribs, name) && attribs[name] != null;
}
function getName(element) {
  return element.name;
}
function nextElementSibling(element) {
  let { next } = element;
  while (next !== null && !isTag2(next))
    ({ next } = next);
  return next;
}
function prevElementSibling(element) {
  let { prev } = element;
  while (prev !== null && !isTag2(prev))
    ({ prev } = prev);
  return prev;
}
var init_traversal = __esm({
  "node_modules/domutils/dist/traversal.js"() {
    init_dist2();
  }
});

// node_modules/domutils/dist/index.js
var dist_exports2 = {};
__export(dist_exports2, {
  DocumentPosition: () => DocumentPosition,
  append: () => append,
  appendChild: () => appendChild,
  compareDocumentPosition: () => compareDocumentPosition,
  existsOne: () => existsOne,
  filter: () => filter,
  find: () => find,
  findAll: () => findAll,
  findOne: () => findOne,
  getAttributeValue: () => getAttributeValue,
  getChildren: () => getChildren,
  getElementById: () => getElementById,
  getElements: () => getElements,
  getElementsByClassName: () => getElementsByClassName,
  getElementsByTagName: () => getElementsByTagName,
  getElementsByTagType: () => getElementsByTagType,
  getFeed: () => getFeed,
  getInnerHTML: () => getInnerHTML,
  getName: () => getName,
  getOuterHTML: () => getOuterHTML,
  getParent: () => getParent,
  getSiblings: () => getSiblings,
  getText: () => getText,
  hasAttrib: () => hasAttrib,
  innerText: () => innerText,
  nextElementSibling: () => nextElementSibling,
  prepend: () => prepend,
  prependChild: () => prependChild,
  prevElementSibling: () => prevElementSibling,
  removeElement: () => removeElement,
  removeSubsets: () => removeSubsets,
  replaceElement: () => replaceElement,
  testElement: () => testElement,
  textContent: () => textContent,
  uniqueSort: () => uniqueSort
});
var init_dist5 = __esm({
  "node_modules/domutils/dist/index.js"() {
    init_feeds();
    init_helpers();
    init_legacy();
    init_manipulation();
    init_querying();
    init_stringify();
    init_traversal();
  }
});

// node_modules/htmlparser2/dist/index.js
var dist_exports3 = {};
__export(dist_exports3, {
  DefaultHandler: () => DomHandler,
  DomHandler: () => DomHandler,
  DomUtils: () => dist_exports2,
  ElementType: () => dist_exports,
  Parser: () => Parser,
  QuoteType: () => QuoteType,
  Tokenizer: () => Tokenizer,
  createDocumentStream: () => createDocumentStream,
  getFeed: () => getFeed,
  parseDocument: () => parseDocument,
  parseFeed: () => parseFeed
});
function parseDocument(data, options) {
  const handler = new DomHandler(void 0, options);
  new Parser(handler, options).end(data);
  return handler.root;
}
function createDocumentStream(callback, options, elementCallback) {
  const handler = new DomHandler((error) => callback(error, handler.root), options, elementCallback);
  return new Parser(handler, options);
}
function parseFeed(feed, options = parseFeedDefaultOptions) {
  return getFeed(parseDocument(feed, options).children);
}
var parseFeedDefaultOptions;
var init_dist6 = __esm({
  "node_modules/htmlparser2/dist/index.js"() {
    init_Parser();
    init_Parser();
    init_dist2();
    init_dist2();
    init_dist();
    init_Tokenizer();
    init_dist5();
    init_dist5();
    init_dist5();
    parseFeedDefaultOptions = { xmlMode: true };
  }
});

// node_modules/escape-string-regexp/index.js
var require_escape_string_regexp = __commonJS({
  "node_modules/escape-string-regexp/index.js"(exports, module) {
    "use strict";
    module.exports = (string) => {
      if (typeof string !== "string") {
        throw new TypeError("Expected a string");
      }
      return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
    };
  }
});

// node_modules/is-plain-object/dist/is-plain-object.js
var require_is_plain_object = __commonJS({
  "node_modules/is-plain-object/dist/is-plain-object.js"(exports) {
    "use strict";
    function isObject(o) {
      return Object.prototype.toString.call(o) === "[object Object]";
    }
    function isPlainObject(o) {
      var ctor, prot;
      if (isObject(o) === false) return false;
      ctor = o.constructor;
      if (ctor === void 0) return true;
      prot = ctor.prototype;
      if (isObject(prot) === false) return false;
      if (prot.hasOwnProperty("isPrototypeOf") === false) {
        return false;
      }
      return true;
    }
    exports.isPlainObject = isPlainObject;
  }
});

// node_modules/parse-srcset/src/parse-srcset.js
var require_parse_srcset = __commonJS({
  "node_modules/parse-srcset/src/parse-srcset.js"(exports, module) {
    (function(root, factory) {
      if (typeof define === "function" && define.amd) {
        define([], factory);
      } else if (typeof module === "object" && module.exports) {
        module.exports = factory();
      } else {
        root.parseSrcset = factory();
      }
    })(exports, function() {
      return function(input) {
        function isSpace(c2) {
          return c2 === " " || // space
          c2 === "	" || // horizontal tab
          c2 === "\n" || // new line
          c2 === "\f" || // form feed
          c2 === "\r";
        }
        function collectCharacters(regEx) {
          var chars, match = regEx.exec(input.substring(pos));
          if (match) {
            chars = match[0];
            pos += chars.length;
            return chars;
          }
        }
        var inputLength = input.length, regexLeadingSpaces = /^[ \t\n\r\u000c]+/, regexLeadingCommasOrSpaces = /^[, \t\n\r\u000c]+/, regexLeadingNotSpaces = /^[^ \t\n\r\u000c]+/, regexTrailingCommas = /[,]+$/, regexNonNegativeInteger = /^\d+$/, regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/, url, descriptors, currentDescriptor, state, c, pos = 0, candidates = [];
        while (true) {
          collectCharacters(regexLeadingCommasOrSpaces);
          if (pos >= inputLength) {
            return candidates;
          }
          url = collectCharacters(regexLeadingNotSpaces);
          descriptors = [];
          if (url.slice(-1) === ",") {
            url = url.replace(regexTrailingCommas, "");
            parseDescriptors();
          } else {
            tokenize();
          }
        }
        function tokenize() {
          collectCharacters(regexLeadingSpaces);
          currentDescriptor = "";
          state = "in descriptor";
          while (true) {
            c = input.charAt(pos);
            if (state === "in descriptor") {
              if (isSpace(c)) {
                if (currentDescriptor) {
                  descriptors.push(currentDescriptor);
                  currentDescriptor = "";
                  state = "after descriptor";
                }
              } else if (c === ",") {
                pos += 1;
                if (currentDescriptor) {
                  descriptors.push(currentDescriptor);
                }
                parseDescriptors();
                return;
              } else if (c === "(") {
                currentDescriptor = currentDescriptor + c;
                state = "in parens";
              } else if (c === "") {
                if (currentDescriptor) {
                  descriptors.push(currentDescriptor);
                }
                parseDescriptors();
                return;
              } else {
                currentDescriptor = currentDescriptor + c;
              }
            } else if (state === "in parens") {
              if (c === ")") {
                currentDescriptor = currentDescriptor + c;
                state = "in descriptor";
              } else if (c === "") {
                descriptors.push(currentDescriptor);
                parseDescriptors();
                return;
              } else {
                currentDescriptor = currentDescriptor + c;
              }
            } else if (state === "after descriptor") {
              if (isSpace(c)) {
              } else if (c === "") {
                parseDescriptors();
                return;
              } else {
                state = "in descriptor";
                pos -= 1;
              }
            }
            pos += 1;
          }
        }
        function parseDescriptors() {
          var pError = false, w, d, h, i, candidate = {}, desc, lastChar, value, intVal, floatVal;
          for (i = 0; i < descriptors.length; i++) {
            desc = descriptors[i];
            lastChar = desc[desc.length - 1];
            value = desc.substring(0, desc.length - 1);
            intVal = parseInt(value, 10);
            floatVal = parseFloat(value);
            if (regexNonNegativeInteger.test(value) && lastChar === "w") {
              if (w || d) {
                pError = true;
              }
              if (intVal === 0) {
                pError = true;
              } else {
                w = intVal;
              }
            } else if (regexFloatingPoint.test(value) && lastChar === "x") {
              if (w || d || h) {
                pError = true;
              }
              if (floatVal < 0) {
                pError = true;
              } else {
                d = floatVal;
              }
            } else if (regexNonNegativeInteger.test(value) && lastChar === "h") {
              if (h || d) {
                pError = true;
              }
              if (intVal === 0) {
                pError = true;
              } else {
                h = intVal;
              }
            } else {
              pError = true;
            }
          }
          if (!pError) {
            candidate.url = url;
            if (w) {
              candidate.w = w;
            }
            if (d) {
              candidate.d = d;
            }
            if (h) {
              candidate.h = h;
            }
            candidates.push(candidate);
          } else if (console && console.log) {
            console.log("Invalid srcset descriptor found in '" + input + "' at '" + desc + "'.");
          }
        }
      };
    });
  }
});

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "node_modules/picocolors/picocolors.js"(exports, module) {
    var p = process || {};
    var argv = p.argv || [];
    var env = p.env || {};
    var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor = 0;
      do {
        result += string.substring(cursor, index) + replace;
        cursor = index + close.length;
        index = string.indexOf(close, cursor);
      } while (~index);
      return result + string.substring(cursor);
    };
    var createColors = (enabled = isColorSupported) => {
      let f = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f("\x1B[0m", "\x1B[0m"),
        bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f("\x1B[3m", "\x1B[23m"),
        underline: f("\x1B[4m", "\x1B[24m"),
        inverse: f("\x1B[7m", "\x1B[27m"),
        hidden: f("\x1B[8m", "\x1B[28m"),
        strikethrough: f("\x1B[9m", "\x1B[29m"),
        black: f("\x1B[30m", "\x1B[39m"),
        red: f("\x1B[31m", "\x1B[39m"),
        green: f("\x1B[32m", "\x1B[39m"),
        yellow: f("\x1B[33m", "\x1B[39m"),
        blue: f("\x1B[34m", "\x1B[39m"),
        magenta: f("\x1B[35m", "\x1B[39m"),
        cyan: f("\x1B[36m", "\x1B[39m"),
        white: f("\x1B[37m", "\x1B[39m"),
        gray: f("\x1B[90m", "\x1B[39m"),
        bgBlack: f("\x1B[40m", "\x1B[49m"),
        bgRed: f("\x1B[41m", "\x1B[49m"),
        bgGreen: f("\x1B[42m", "\x1B[49m"),
        bgYellow: f("\x1B[43m", "\x1B[49m"),
        bgBlue: f("\x1B[44m", "\x1B[49m"),
        bgMagenta: f("\x1B[45m", "\x1B[49m"),
        bgCyan: f("\x1B[46m", "\x1B[49m"),
        bgWhite: f("\x1B[47m", "\x1B[49m"),
        blackBright: f("\x1B[90m", "\x1B[39m"),
        redBright: f("\x1B[91m", "\x1B[39m"),
        greenBright: f("\x1B[92m", "\x1B[39m"),
        yellowBright: f("\x1B[93m", "\x1B[39m"),
        blueBright: f("\x1B[94m", "\x1B[39m"),
        magentaBright: f("\x1B[95m", "\x1B[39m"),
        cyanBright: f("\x1B[96m", "\x1B[39m"),
        whiteBright: f("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f("\x1B[100m", "\x1B[49m"),
        bgRedBright: f("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f("\x1B[107m", "\x1B[49m")
      };
    };
    module.exports = createColors();
    module.exports.createColors = createColors;
  }
});

// node_modules/postcss/lib/tokenize.js
var require_tokenize = __commonJS({
  "node_modules/postcss/lib/tokenize.js"(exports, module) {
    "use strict";
    var SINGLE_QUOTE = "'".charCodeAt(0);
    var DOUBLE_QUOTE = '"'.charCodeAt(0);
    var BACKSLASH = "\\".charCodeAt(0);
    var SLASH = "/".charCodeAt(0);
    var NEWLINE = "\n".charCodeAt(0);
    var SPACE = " ".charCodeAt(0);
    var FEED = "\f".charCodeAt(0);
    var TAB = "	".charCodeAt(0);
    var CR = "\r".charCodeAt(0);
    var OPEN_SQUARE = "[".charCodeAt(0);
    var CLOSE_SQUARE = "]".charCodeAt(0);
    var OPEN_PARENTHESES = "(".charCodeAt(0);
    var CLOSE_PARENTHESES = ")".charCodeAt(0);
    var OPEN_CURLY = "{".charCodeAt(0);
    var CLOSE_CURLY = "}".charCodeAt(0);
    var SEMICOLON = ";".charCodeAt(0);
    var ASTERISK = "*".charCodeAt(0);
    var COLON = ":".charCodeAt(0);
    var AT = "@".charCodeAt(0);
    var RE_AT_END = /[\t\n\f\r "#'()/;[\\\]{}]/g;
    var RE_WORD_END = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g;
    var RE_BAD_BRACKET = /.[\r\n"'(/\\]/;
    var RE_HEX_ESCAPE = /[\da-f]/i;
    var RE_URL_NAME = /(^|[\t\n\f\r "'(),/:;[\]{}])url$/i;
    var RE_QUOTED = /[\t\n\f\r ]*["']/y;
    module.exports = function tokenizer(input, options = {}) {
      let css = input.css.valueOf();
      let ignore = options.ignoreErrors;
      let code, content, escape3, next, quote;
      let currentToken, escaped, escapePos;
      let length = css.length;
      let pos = 0;
      let returned = [];
      let lastBadParen = -1;
      function position() {
        return pos;
      }
      function unclosed(what) {
        throw input.error("Unclosed " + what, pos);
      }
      function endOfFile() {
        return returned.length === 0 && pos >= length;
      }
      function nextToken(opts) {
        if (returned.length) return returned.pop();
        if (pos >= length) return;
        let ignoreUnclosed = opts ? opts.ignoreUnclosed : false;
        code = css.charCodeAt(pos);
        switch (code) {
          case NEWLINE:
          case SPACE:
          case TAB:
          case CR:
          case FEED: {
            next = pos;
            do {
              next += 1;
              code = css.charCodeAt(next);
            } while (code === SPACE || code === NEWLINE || code === TAB || code === CR || code === FEED);
            currentToken = ["space", css.slice(pos, next)];
            pos = next - 1;
            break;
          }
          case OPEN_SQUARE:
          case CLOSE_SQUARE:
          case OPEN_CURLY:
          case CLOSE_CURLY:
          case COLON:
          case SEMICOLON:
          case CLOSE_PARENTHESES: {
            let controlChar = String.fromCharCode(code);
            currentToken = [controlChar, controlChar, pos];
            break;
          }
          case OPEN_PARENTHESES: {
            RE_QUOTED.lastIndex = pos + 1;
            if (RE_URL_NAME.test(css.substring(pos - 4, pos)) && !RE_QUOTED.test(css)) {
              next = pos;
              do {
                escaped = false;
                next = css.indexOf(")", next + 1);
                if (next === -1) {
                  if (ignore || ignoreUnclosed) {
                    next = pos;
                    break;
                  } else {
                    unclosed("bracket");
                  }
                }
                escapePos = next;
                while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                  escapePos -= 1;
                  escaped = !escaped;
                }
              } while (escaped);
              currentToken = ["brackets", css.slice(pos, next + 1), pos, next];
              pos = next;
            } else if (pos <= lastBadParen) {
              currentToken = ["(", "(", pos];
            } else {
              next = css.indexOf(")", pos + 1);
              content = css.slice(pos, next + 1);
              if (next === -1 || RE_BAD_BRACKET.test(content)) {
                lastBadParen = next === -1 ? length : next;
                currentToken = ["(", "(", pos];
              } else {
                currentToken = ["brackets", content, pos, next];
                pos = next;
              }
            }
            break;
          }
          case SINGLE_QUOTE:
          case DOUBLE_QUOTE: {
            quote = code === SINGLE_QUOTE ? "'" : '"';
            next = pos;
            do {
              escaped = false;
              next = css.indexOf(quote, next + 1);
              if (next === -1) {
                if (ignore || ignoreUnclosed) {
                  next = pos + 1;
                  break;
                } else {
                  unclosed("string");
                }
              }
              escapePos = next;
              while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                escapePos -= 1;
                escaped = !escaped;
              }
            } while (escaped);
            currentToken = ["string", css.slice(pos, next + 1), pos, next];
            pos = next;
            break;
          }
          case AT: {
            RE_AT_END.lastIndex = pos + 1;
            RE_AT_END.test(css);
            if (RE_AT_END.lastIndex === 0) {
              next = css.length - 1;
            } else {
              next = RE_AT_END.lastIndex - 2;
            }
            currentToken = ["at-word", css.slice(pos, next + 1), pos, next];
            pos = next;
            break;
          }
          case BACKSLASH: {
            next = pos;
            escape3 = true;
            while (css.charCodeAt(next + 1) === BACKSLASH) {
              next += 1;
              escape3 = !escape3;
            }
            code = css.charCodeAt(next + 1);
            if (escape3 && code !== SLASH && code !== SPACE && code !== NEWLINE && code !== TAB && code !== CR && code !== FEED) {
              next += 1;
              if (RE_HEX_ESCAPE.test(css.charAt(next))) {
                while (RE_HEX_ESCAPE.test(css.charAt(next + 1))) {
                  next += 1;
                }
                if (css.charCodeAt(next + 1) === SPACE) {
                  next += 1;
                }
              }
            }
            currentToken = ["word", css.slice(pos, next + 1), pos, next];
            pos = next;
            break;
          }
          default: {
            if (code === SLASH && css.charCodeAt(pos + 1) === ASTERISK) {
              next = css.indexOf("*/", pos + 2) + 1;
              if (next === 0) {
                if (ignore || ignoreUnclosed) {
                  next = css.length;
                } else {
                  unclosed("comment");
                }
              }
              currentToken = ["comment", css.slice(pos, next + 1), pos, next];
              pos = next;
            } else {
              RE_WORD_END.lastIndex = pos + 1;
              RE_WORD_END.test(css);
              if (RE_WORD_END.lastIndex === 0) {
                next = css.length - 1;
              } else {
                next = RE_WORD_END.lastIndex - 2;
              }
              currentToken = ["word", css.slice(pos, next + 1), pos, next];
              pos = next;
            }
            break;
          }
        }
        pos++;
        return currentToken;
      }
      function back(token) {
        returned.push(token);
      }
      return {
        back,
        endOfFile,
        nextToken,
        position
      };
    };
  }
});

// node_modules/postcss/lib/terminal-highlight.js
var require_terminal_highlight = __commonJS({
  "node_modules/postcss/lib/terminal-highlight.js"(exports, module) {
    "use strict";
    var pico = require_picocolors();
    var tokenizer = require_tokenize();
    var Input;
    function registerInput(dependant) {
      Input = dependant;
    }
    var HIGHLIGHT_THEME = {
      ";": pico.yellow,
      ":": pico.yellow,
      "(": pico.cyan,
      ")": pico.cyan,
      "[": pico.yellow,
      "]": pico.yellow,
      "{": pico.yellow,
      "}": pico.yellow,
      "at-word": pico.cyan,
      "brackets": pico.cyan,
      "call": pico.cyan,
      "class": pico.yellow,
      "comment": pico.gray,
      "hash": pico.magenta,
      "string": pico.green
    };
    function getTokenType([type, value], processor) {
      if (type === "word") {
        if (value[0] === ".") {
          return "class";
        }
        if (value[0] === "#") {
          return "hash";
        }
      }
      if (!processor.endOfFile()) {
        let next = processor.nextToken();
        processor.back(next);
        if (next[0] === "brackets" || next[0] === "(") return "call";
      }
      return type;
    }
    function terminalHighlight(css) {
      let processor = tokenizer(new Input(css), { ignoreErrors: true });
      let result = "";
      while (!processor.endOfFile()) {
        let token = processor.nextToken();
        let color = HIGHLIGHT_THEME[getTokenType(token, processor)];
        if (color) {
          result += token[1].split(/\r?\n/).map((i) => color(i)).join("\n");
        } else {
          result += token[1];
        }
      }
      return result;
    }
    terminalHighlight.registerInput = registerInput;
    module.exports = terminalHighlight;
  }
});

// node_modules/postcss/lib/css-syntax-error.js
var require_css_syntax_error = __commonJS({
  "node_modules/postcss/lib/css-syntax-error.js"(exports, module) {
    "use strict";
    var pico = require_picocolors();
    var terminalHighlight = require_terminal_highlight();
    var CssSyntaxError = class _CssSyntaxError extends Error {
      constructor(message, line, column, source, file, plugin) {
        super(message);
        this.name = "CssSyntaxError";
        this.reason = message;
        if (file) {
          this.file = file;
        }
        if (source) {
          this.source = source;
        }
        if (plugin) {
          this.plugin = plugin;
        }
        if (typeof line !== "undefined" && typeof column !== "undefined") {
          if (typeof line === "number") {
            this.line = line;
            this.column = column;
          } else {
            this.line = line.line;
            this.column = line.column;
            this.endLine = column.line;
            this.endColumn = column.column;
          }
        }
        this.setMessage();
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, _CssSyntaxError);
        }
      }
      setMessage() {
        this.message = this.plugin ? this.plugin + ": " : "";
        this.message += this.file ? this.file : "<css input>";
        if (typeof this.line !== "undefined") {
          this.message += ":" + this.line + ":" + this.column;
        }
        this.message += ": " + this.reason;
      }
      showSourceCode(color) {
        if (!this.source) return "";
        let css = this.source;
        if (color == null) color = pico.isColorSupported;
        let aside = (text) => text;
        let mark = (text) => text;
        let highlight = (text) => text;
        if (color) {
          let { bold, gray, red } = pico.createColors(true);
          mark = (text) => bold(red(text));
          aside = (text) => gray(text);
          if (terminalHighlight) {
            highlight = (text) => terminalHighlight(text);
          }
        }
        let lines = css.split(/\r?\n/);
        let start = Math.max(this.line - 3, 0);
        let end = Math.min(this.line + 2, lines.length);
        let maxWidth = String(end).length;
        return lines.slice(start, end).map((line, index) => {
          let number = start + 1 + index;
          let gutter = " " + (" " + number).slice(-maxWidth) + " | ";
          if (number === this.line) {
            if (line.length > 160) {
              let padding = 20;
              let endColumn = typeof this.endColumn === "number" ? this.endColumn : this.column;
              let subLineStart = Math.max(0, this.column - padding);
              let subLineEnd = Math.max(this.column + padding, endColumn + padding);
              let subLine = line.slice(subLineStart, subLineEnd);
              let spacing2 = aside(gutter.replace(/\d/g, " ")) + line.slice(0, Math.min(this.column - 1, padding - 1)).replace(/[^\t]/g, " ");
              return mark(">") + aside(gutter) + highlight(subLine) + "\n " + spacing2 + mark("^");
            }
            let spacing = aside(gutter.replace(/\d/g, " ")) + line.slice(0, this.column - 1).replace(/[^\t]/g, " ");
            return mark(">") + aside(gutter) + highlight(line) + "\n " + spacing + mark("^");
          }
          return " " + aside(gutter) + highlight(line);
        }).join("\n");
      }
      toString() {
        let code = this.showSourceCode();
        if (code) {
          code = "\n\n" + code + "\n";
        }
        return this.name + ": " + this.message + code;
      }
    };
    module.exports = CssSyntaxError;
    CssSyntaxError.default = CssSyntaxError;
  }
});

// node_modules/postcss/lib/stringifier.js
var require_stringifier = __commonJS({
  "node_modules/postcss/lib/stringifier.js"(exports, module) {
    "use strict";
    var AT_NAME_END = /[\t\n\f\r "#'()/;[\\\]{}]/;
    var DEFAULT_RAW = {
      after: "\n",
      beforeClose: "\n",
      beforeComment: "\n",
      beforeDecl: "\n",
      beforeOpen: " ",
      beforeRule: "\n",
      colon: ": ",
      commentLeft: " ",
      commentRight: " ",
      emptyBody: "",
      indent: "    ",
      semicolon: false
    };
    function capitalize(str2) {
      return str2[0].toUpperCase() + str2.slice(1);
    }
    function atruleStart(str2, node) {
      let name = "@" + node.name;
      let params = node.params ? str2.rawValue(node, "params") : "";
      let afterName = node.raws.afterName;
      if (typeof afterName === "undefined") {
        afterName = params ? " " : "";
      } else if (afterName === "" && params && !AT_NAME_END.test(params[0])) {
        afterName = " ";
      }
      return name + afterName + params;
    }
    function isCustomProperty(node) {
      if (!node.prop.startsWith("--")) return false;
      let before = node.raws.before;
      return typeof before === "undefined" || !/[^\s;]$/.test(before);
    }
    function pushBody(str2, stack, node) {
      let nodes = node.nodes;
      let last = nodes.length - 1;
      while (last > 0) {
        if (nodes[last].type !== "comment") break;
        last -= 1;
      }
      let semicolon = str2.raw(node, "semicolon");
      let isDocument2 = node.type === "document";
      for (let i = nodes.length - 1; i >= 0; i--) {
        let child = nodes[i];
        let childSemicolon = last !== i || semicolon;
        if (!childSemicolon && i < nodes.length - 1 && (child.type === "atrule" && !child.nodes || child.type === "decl" && isCustomProperty(child))) {
          childSemicolon = true;
        }
        stack.push({
          document: isDocument2,
          node: child,
          semicolon: childSemicolon
        });
      }
    }
    function pushBlock(str2, stack, node, start) {
      let between = str2.raw(node, "between", "beforeOpen");
      str2.builder(start + between + "{", node, "start");
      let hasNodes = node.nodes && node.nodes.length;
      let close = () => {
        let after = hasNodes ? str2.raw(node, "after") : str2.raw(node, "after", "emptyBody");
        if (after) str2.builder(after);
        str2.builder("}", node, "end");
        if (node.type === "rule" && node.raws.ownSemicolon) {
          str2.builder(node.raws.ownSemicolon, node, "end");
        }
      };
      if (hasNodes) {
        stack.push(close);
        pushBody(str2, stack, node);
      } else {
        close();
      }
    }
    var Stringifier = class _Stringifier {
      constructor(builder) {
        this.builder = builder;
      }
      atrule(node, semicolon) {
        let start = atruleStart(this, node);
        if (node.nodes) {
          this.block(node, start);
        } else {
          let end = (node.raws.between || "") + (semicolon ? ";" : "");
          this.builder(start + end, node);
        }
      }
      beforeAfter(node, detect) {
        let value;
        if (node.type === "decl") {
          value = this.raw(node, null, "beforeDecl");
        } else if (node.type === "comment") {
          value = this.raw(node, null, "beforeComment");
        } else if (detect === "before") {
          value = this.raw(node, null, "beforeRule");
        } else {
          value = this.raw(node, null, "beforeClose");
        }
        let buf = node.parent;
        let depth = 0;
        while (buf && buf.type !== "root") {
          depth += 1;
          buf = buf.parent;
        }
        if (value.includes("\n")) {
          let indent = this.raw(node, null, "indent");
          if (indent.length) {
            for (let step = 0; step < depth; step++) value += indent;
          }
        }
        return value;
      }
      block(node, start) {
        let between = this.raw(node, "between", "beforeOpen");
        this.builder(start + between + "{", node, "start");
        let after;
        if (node.nodes && node.nodes.length) {
          this.body(node);
          after = this.raw(node, "after");
        } else {
          after = this.raw(node, "after", "emptyBody");
        }
        if (after) this.builder(after);
        this.builder("}", node, "end");
      }
      body(node) {
        let proto = _Stringifier.prototype;
        let expandable = ["atrule", "block", "body", "rule", "stringify"].every(
          (method) => this[method] === proto[method]
        );
        let stack = [];
        pushBody(this, stack, node);
        while (stack.length > 0) {
          let entry2 = stack.pop();
          if (typeof entry2 === "function") {
            entry2();
            continue;
          }
          let child = entry2.node;
          let before = this.raw(child, "before");
          if (before) {
            this.builder(before);
          }
          if (expandable && child.type === "rule") {
            pushBlock(this, stack, child, this.rawValue(child, "selector"));
          } else if (expandable && child.type === "atrule" && child.nodes) {
            pushBlock(this, stack, child, atruleStart(this, child));
          } else {
            this.stringify(child, entry2.semicolon);
          }
        }
      }
      comment(node) {
        let left = this.raw(node, "left", "commentLeft");
        let right = this.raw(node, "right", "commentRight");
        this.builder("/*" + left + node.text + right + "*/", node);
      }
      decl(node, semicolon) {
        let raws = node.raws;
        let between = this.raw(node, "between", "colon");
        let string = node.prop + between + this.rawValue(node, "value");
        if (node.important) {
          string += raws.important || " !important";
        }
        if (semicolon) string += ";";
        this.builder(string, node);
      }
      document(node) {
        this.body(node);
      }
      raw(node, own, detect) {
        let value;
        if (!detect) detect = own;
        if (own) {
          value = node.raws[own];
          if (typeof value !== "undefined") return value;
        }
        let parent = node.parent;
        if (detect === "before") {
          if (!parent || parent.type === "root" && parent.first === node) {
            return "";
          }
          if (parent && parent.type === "document") {
            return "";
          }
        }
        if (!parent) return DEFAULT_RAW[detect];
        let root = node.root();
        let cache = root.rawCache || (root.rawCache = {});
        if (typeof cache[detect] !== "undefined") {
          return cache[detect];
        }
        if (detect === "before" || detect === "after") {
          return this.beforeAfter(node, detect);
        } else {
          let method = "raw" + capitalize(detect);
          if (this[method]) {
            value = this[method](root, node);
          } else {
            root.walk((i) => {
              value = i.raws[own];
              if (typeof value !== "undefined") return false;
            });
          }
        }
        if (typeof value === "undefined") value = DEFAULT_RAW[detect];
        cache[detect] = value;
        return value;
      }
      rawBeforeClose(root) {
        let value;
        root.walk((i) => {
          if (i.nodes && i.nodes.length > 0) {
            if (typeof i.raws.after !== "undefined") {
              value = i.raws.after;
              if (value.includes("\n")) {
                value = value.replace(/[^\n]+$/, "");
              }
              return false;
            }
          }
        });
        if (value) value = value.replace(/\S/g, "");
        return value;
      }
      rawBeforeComment(root, node) {
        let value;
        root.walkComments((i) => {
          if (typeof i.raws.before !== "undefined") {
            value = i.raws.before;
            if (value.includes("\n")) {
              value = value.replace(/[^\n]+$/, "");
            }
            return false;
          }
        });
        if (typeof value === "undefined") {
          value = this.raw(node, null, "beforeDecl");
        } else if (value) {
          value = value.replace(/\S/g, "");
        }
        return value;
      }
      rawBeforeDecl(root, node) {
        let value;
        root.walkDecls((i) => {
          if (typeof i.raws.before !== "undefined") {
            value = i.raws.before;
            if (value.includes("\n")) {
              value = value.replace(/[^\n]+$/, "");
            }
            return false;
          }
        });
        if (typeof value === "undefined") {
          value = this.raw(node, null, "beforeRule");
        } else if (value) {
          value = value.replace(/\S/g, "");
        }
        return value;
      }
      rawBeforeOpen(root) {
        let value;
        root.walk((i) => {
          if (i.type !== "decl") {
            value = i.raws.between;
            if (typeof value !== "undefined") return false;
          }
        });
        return value;
      }
      rawBeforeRule(root) {
        let value;
        root.walk((i) => {
          if (i.nodes && (i.parent !== root || root.first !== i)) {
            if (typeof i.raws.before !== "undefined") {
              value = i.raws.before;
              if (value.includes("\n")) {
                value = value.replace(/[^\n]+$/, "");
              }
              return false;
            }
          }
        });
        if (value) value = value.replace(/\S/g, "");
        return value;
      }
      rawColon(root) {
        let value;
        root.walkDecls((i) => {
          if (typeof i.raws.between !== "undefined") {
            value = i.raws.between.replace(/[^\s:]/g, "");
            return false;
          }
        });
        return value;
      }
      rawEmptyBody(root) {
        let value;
        root.walk((i) => {
          if (i.nodes && i.nodes.length === 0) {
            value = i.raws.after;
            if (typeof value !== "undefined") return false;
          }
        });
        return value;
      }
      rawIndent(root) {
        if (root.raws.indent) return root.raws.indent;
        let value;
        root.walk((i) => {
          let p = i.parent;
          if (p && p !== root && p.parent && p.parent === root) {
            if (typeof i.raws.before !== "undefined") {
              let parts = i.raws.before.split("\n");
              value = parts[parts.length - 1];
              value = value.replace(/\S/g, "");
              return false;
            }
          }
        });
        return value;
      }
      rawSemicolon(root) {
        let value;
        root.walk((i) => {
          if (i.nodes && i.nodes.length && i.last.type === "decl") {
            value = i.raws.semicolon;
            if (typeof value !== "undefined") return false;
          }
        });
        return value;
      }
      rawValue(node, prop) {
        let value = node[prop];
        let raw = node.raws[prop];
        if (raw && raw.value === value) {
          return raw.raw;
        }
        return value;
      }
      root(node) {
        let inDocument = node.parent && node.parent.type === "document";
        if (!inDocument && node.source && node.source.input.hasBOM) {
          this.builder("\uFEFF", node, "start");
        }
        this.body(node);
        if (node.raws.after) {
          this.builder(node.raws.after);
        }
      }
      rule(node) {
        this.block(node, this.rawValue(node, "selector"));
        if (node.raws.ownSemicolon) {
          this.builder(node.raws.ownSemicolon, node, "end");
        }
      }
      stringify(node, semicolon) {
        if (!this[node.type]) {
          throw new Error(
            "Unknown AST node type " + node.type + ". Maybe you need to change PostCSS stringifier."
          );
        }
        this[node.type](node, semicolon);
      }
    };
    module.exports = Stringifier;
    Stringifier.default = Stringifier;
  }
});

// node_modules/postcss/lib/stringify.js
var require_stringify = __commonJS({
  "node_modules/postcss/lib/stringify.js"(exports, module) {
    "use strict";
    var Stringifier = require_stringifier();
    var STYLE_TAG = /(<)(\/?style\b)/gi;
    var COMMENT_OPEN = /(<)(!--)/g;
    function escapeHTMLInCSS(str2) {
      if (!str2.includes("<")) return str2;
      return str2.replace(STYLE_TAG, "\\3c $2").replace(COMMENT_OPEN, "\\3c $2");
    }
    function cutEscaped(chunks, css, escaped) {
      let parts = [];
      let at = 0;
      let into = 0;
      for (let i = 0; i < chunks.length; i += 3) {
        let from = into;
        let end = at + chunks[i].length;
        while (at < end) {
          if (css[at] === escaped[into]) {
            at += 1;
            into += 1;
          } else {
            at += 1;
            into += 4;
          }
        }
        parts.push(escaped.slice(from, into));
      }
      return parts;
    }
    var SafeStringifier = class extends Stringifier {
      escapeHTML(print) {
        let builder = this.builder;
        let chunks, css;
        this.builder = (str2, child, type) => {
          if (chunks) {
            css += str2;
            chunks.push(str2, child, type);
          } else if (str2.includes("<")) {
            css = str2;
            chunks = [str2, child, type];
          } else {
            builder(str2, child, type);
          }
        };
        print();
        this.builder = builder;
        if (!chunks) return;
        let escaped = escapeHTMLInCSS(css);
        if (escaped === css) {
          for (let i = 0; i < chunks.length; i += 3) {
            builder(chunks[i], chunks[i + 1], chunks[i + 2]);
          }
        } else {
          let parts = cutEscaped(chunks, css, escaped);
          for (let i = 0; i < chunks.length; i += 3) {
            builder(parts[i / 3], chunks[i + 1], chunks[i + 2]);
          }
        }
      }
      root(node) {
        if (node.parent && node.parent.type === "document") {
          this.escapeHTML(() => this.body(node));
          if (node.raws.after) this.builder(node.raws.after);
        } else {
          this.escapeHTML(() => super.root(node));
        }
      }
    };
    function stringify2(node, builder) {
      let str2 = new SafeStringifier(builder);
      if (node.type === "root" || node.type === "document") {
        str2.stringify(node);
      } else {
        str2.escapeHTML(() => str2.stringify(node));
      }
    }
    module.exports = stringify2;
    stringify2.default = stringify2;
  }
});

// node_modules/postcss/lib/symbols.js
var require_symbols = __commonJS({
  "node_modules/postcss/lib/symbols.js"(exports, module) {
    "use strict";
    module.exports.isClean = /* @__PURE__ */ Symbol("isClean");
    module.exports.my = /* @__PURE__ */ Symbol("my");
  }
});

// node_modules/postcss/lib/node.js
var require_node = __commonJS({
  "node_modules/postcss/lib/node.js"(exports, module) {
    "use strict";
    var CssSyntaxError = require_css_syntax_error();
    var Stringifier = require_stringifier();
    var stringify2 = require_stringify();
    var { isClean, my } = require_symbols();
    function cloneNode2(obj, parent) {
      let cloned = new obj.constructor();
      let stack = [[obj, cloned, parent]];
      while (stack.length > 0) {
        let [source, target, targetParent] = stack.pop();
        for (let i in source) {
          if (!Object.prototype.hasOwnProperty.call(source, i)) {
            continue;
          }
          if (i === "proxyCache") continue;
          let value = source[i];
          let type = typeof value;
          if (i === "parent" && type === "object") {
            if (targetParent) target[i] = targetParent;
          } else if (i === "source") {
            target[i] = value;
          } else if (Array.isArray(value)) {
            let children = [];
            target[i] = children;
            for (let j of value) {
              let childClone = new j.constructor();
              children.push(childClone);
              stack.push([j, childClone, target]);
            }
          } else {
            if (type === "object" && value !== null) {
              let valueClone = new value.constructor();
              stack.push([value, valueClone, void 0]);
              value = valueClone;
            }
            target[i] = value;
          }
        }
      }
      return cloned;
    }
    function sourceOffset(inputCSS, position) {
      if (position && typeof position.offset !== "undefined") {
        return position.offset;
      }
      let column = 1;
      let line = 1;
      let offset = 0;
      for (let i = 0; i < inputCSS.length; i++) {
        if (line === position.line && column === position.column) {
          offset = i;
          break;
        }
        if (inputCSS[i] === "\n") {
          column = 1;
          line += 1;
        } else {
          column += 1;
        }
      }
      return offset;
    }
    var Node2 = class _Node {
      get proxyOf() {
        return this;
      }
      constructor(defaults = {}) {
        this.raws = {};
        this[isClean] = false;
        this[my] = true;
        for (let name of Object.keys(defaults)) {
          if (name === "__proto__") continue;
          if (name === "nodes") {
            this.nodes = [];
            for (let node of defaults[name]) {
              if (typeof node.clone === "function" && node.parent) {
                this.append(node.clone());
              } else {
                this.append(node);
              }
            }
          } else {
            this[name] = defaults[name];
          }
        }
      }
      addToError(error) {
        error.postcssNode = this;
        if (error.stack && this.source && /\n\s{4}at /.test(error.stack)) {
          let s = this.source;
          error.stack = error.stack.replace(
            /\n\s{4}at /,
            `$&${s.input.from}:${s.start.line}:${s.start.column}$&`
          );
        }
        return error;
      }
      after(add) {
        this.parent.insertAfter(this, add);
        return this;
      }
      assign(overrides = {}) {
        for (let name in overrides) {
          this[name] = overrides[name];
        }
        return this;
      }
      before(add) {
        this.parent.insertBefore(this, add);
        return this;
      }
      cleanRaws(keepBetween) {
        delete this.raws.before;
        delete this.raws.after;
        if (!keepBetween) delete this.raws.between;
      }
      clone(overrides = {}) {
        let cloned = cloneNode2(this);
        for (let name in overrides) {
          cloned[name] = overrides[name];
        }
        return cloned;
      }
      cloneAfter(overrides = {}) {
        let cloned = this.clone(overrides);
        this.parent.insertAfter(this, cloned);
        return cloned;
      }
      cloneBefore(overrides = {}) {
        let cloned = this.clone(overrides);
        this.parent.insertBefore(this, cloned);
        return cloned;
      }
      error(message, opts = {}) {
        if (this.source) {
          let { end, start } = this.rangeBy(opts);
          return this.source.input.error(
            message,
            { column: start.column, line: start.line },
            { column: end.column, line: end.line },
            opts
          );
        }
        return new CssSyntaxError(message);
      }
      getProxyProcessor() {
        return {
          get(node, prop) {
            if (prop === "proxyOf") {
              return node;
            } else if (prop === "root") {
              return () => node.root().toProxy();
            } else {
              return node[prop];
            }
          },
          set(node, prop, value) {
            if (node[prop] === value) return true;
            node[prop] = value;
            if (prop === "prop" || prop === "value" || prop === "name" || prop === "params" || prop === "important" || /* c8 ignore next */
            prop === "text") {
              node.markDirty();
            }
            return true;
          }
        };
      }
      /* c8 ignore next 3 */
      markClean() {
        this[isClean] = true;
      }
      markDirty() {
        if (this[isClean]) {
          this[isClean] = false;
          let next = this;
          while (next = next.parent) {
            next[isClean] = false;
          }
        }
      }
      next() {
        if (!this.parent) return void 0;
        let index = this.parent.index(this);
        return this.parent.nodes[index + 1];
      }
      positionBy(opts = {}) {
        let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
        let pos = {
          column: this.source.start.column,
          line: this.source.start.line,
          offset: sourceOffset(inputString, this.source.start)
        };
        if (opts.index) {
          pos = this.positionInside(opts.index);
        } else if (opts.word) {
          let stringRepresentation = inputString.slice(
            sourceOffset(inputString, this.source.start),
            this.rangeBy().end.offset
          );
          let index = stringRepresentation.indexOf(opts.word);
          if (index !== -1) pos = this.positionInside(index);
        }
        return pos;
      }
      positionInside(index) {
        let column = this.source.start.column;
        let line = this.source.start.line;
        let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
        let offset = sourceOffset(inputString, this.source.start);
        let end = offset + index;
        for (let i = offset; i < end; i++) {
          if (inputString[i] === "\n") {
            column = 1;
            line += 1;
          } else {
            column += 1;
          }
        }
        return { column, line, offset: end };
      }
      prev() {
        if (!this.parent) return void 0;
        let index = this.parent.index(this);
        return this.parent.nodes[index - 1];
      }
      rangeBy(opts = {}) {
        let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
        let start = {
          column: this.source.start.column,
          line: this.source.start.line,
          offset: sourceOffset(inputString, this.source.start)
        };
        let end = this.source.end ? {
          column: this.source.end.column + 1,
          line: this.source.end.line,
          offset: typeof this.source.end.offset === "number" ? (
            // `source.end.offset` is exclusive, so we don't need to add 1
            this.source.end.offset
          ) : (
            // Since line/column in this.source.end is inclusive,
            // the `sourceOffset(... , this.source.end)` returns an inclusive offset.
            // So, we add 1 to convert it to exclusive.
            sourceOffset(inputString, this.source.end) + 1
          )
        } : {
          column: start.column + 1,
          line: start.line,
          offset: start.offset + 1
        };
        if (opts.word) {
          let stringRepresentation = inputString.slice(
            sourceOffset(inputString, this.source.start),
            end.offset
          );
          let index = stringRepresentation.indexOf(opts.word);
          if (index !== -1) {
            start = this.positionInside(index);
            end = this.positionInside(index + opts.word.length);
          }
        } else {
          if (opts.start) {
            start = {
              column: opts.start.column,
              line: opts.start.line,
              offset: sourceOffset(inputString, opts.start)
            };
          } else if (typeof opts.index === "number") {
            start = this.positionInside(opts.index);
          }
          if (opts.end) {
            end = {
              column: opts.end.column,
              line: opts.end.line,
              offset: sourceOffset(inputString, opts.end)
            };
          } else if (typeof opts.endIndex === "number") {
            end = this.positionInside(opts.endIndex);
          } else if (typeof opts.index === "number") {
            end = this.positionInside(opts.index + 1);
          }
        }
        if (end.line < start.line || end.line === start.line && end.column <= start.column) {
          end = {
            column: start.column + 1,
            line: start.line,
            offset: start.offset + 1
          };
        }
        return { end, start };
      }
      raw(prop, defaultType) {
        let str2 = new Stringifier();
        return str2.raw(this, prop, defaultType);
      }
      remove() {
        if (this.parent) {
          this.parent.removeChild(this);
        }
        this.parent = void 0;
        return this;
      }
      replaceWith(...nodes) {
        if (this.parent) {
          let bookmark = this;
          let foundSelf = false;
          for (let node of nodes) {
            if (node === this) {
              foundSelf = true;
            } else if (foundSelf) {
              this.parent.insertAfter(bookmark, node);
              bookmark = node;
            } else {
              this.parent.insertBefore(bookmark, node);
            }
          }
          if (!foundSelf) {
            this.remove();
          }
        }
        return this;
      }
      root() {
        let result = this;
        while (result.parent && result.parent.type !== "document") {
          result = result.parent;
        }
        return result;
      }
      toJSON(_, inputs) {
        let emitInputs = inputs == null;
        inputs = inputs || /* @__PURE__ */ new Map();
        let holderOfRoot = [];
        let queue = [[this, holderOfRoot, 0]];
        for (let step = 0; step < queue.length; step++) {
          let [node, holder, key] = queue[step];
          let fixed2 = {};
          holder[key] = fixed2;
          for (let name in node) {
            if (!Object.prototype.hasOwnProperty.call(node, name)) {
              continue;
            }
            if (name === "parent" || name === "proxyCache") continue;
            let value = node[name];
            if (Array.isArray(value)) {
              let fixedArray = [];
              fixed2[name] = fixedArray;
              for (let i = 0; i < value.length; i++) {
                let item = value[i];
                if (typeof item === "object" && item.toJSON) {
                  if (item.toJSON === _Node.prototype.toJSON) {
                    queue.push([item, fixedArray, i]);
                  } else {
                    fixedArray[i] = item.toJSON(null, inputs);
                  }
                } else {
                  fixedArray[i] = item;
                }
              }
            } else if (typeof value === "object" && value.toJSON) {
              if (value.toJSON === _Node.prototype.toJSON) {
                queue.push([value, fixed2, name]);
              } else {
                fixed2[name] = value.toJSON(null, inputs);
              }
            } else if (name === "source") {
              if (value == null) continue;
              let inputId = inputs.get(value.input);
              if (inputId == null) {
                inputId = inputs.size;
                inputs.set(value.input, inputId);
              }
              fixed2[name] = {
                end: value.end,
                inputId,
                start: value.start
              };
            } else {
              fixed2[name] = value;
            }
          }
        }
        let fixed = holderOfRoot[0];
        if (emitInputs) {
          fixed.inputs = [...inputs.keys()].map((input) => input.toJSON());
        }
        return fixed;
      }
      toProxy() {
        if (!this.proxyCache) {
          this.proxyCache = new Proxy(this, this.getProxyProcessor());
        }
        return this.proxyCache;
      }
      toString(stringifier = stringify2) {
        if (stringifier.stringify) stringifier = stringifier.stringify;
        let result = "";
        stringifier(this, (i) => {
          result += i;
        });
        return result;
      }
      warn(result, text, opts = {}) {
        let data = { node: this };
        for (let i in opts) data[i] = opts[i];
        return result.warn(text, data);
      }
    };
    module.exports = Node2;
    Node2.default = Node2;
  }
});

// node_modules/postcss/lib/comment.js
var require_comment = __commonJS({
  "node_modules/postcss/lib/comment.js"(exports, module) {
    "use strict";
    var Node2 = require_node();
    var Comment3 = class extends Node2 {
      constructor(defaults) {
        super(defaults);
        this.type = "comment";
      }
    };
    module.exports = Comment3;
    Comment3.default = Comment3;
  }
});

// node_modules/postcss/lib/declaration.js
var require_declaration = __commonJS({
  "node_modules/postcss/lib/declaration.js"(exports, module) {
    "use strict";
    var Node2 = require_node();
    var Declaration = class extends Node2 {
      get variable() {
        return this.prop.startsWith("--") || this.prop[0] === "$";
      }
      constructor(defaults) {
        if (defaults && typeof defaults.value !== "undefined" && typeof defaults.value !== "string") {
          defaults = { ...defaults, value: String(defaults.value) };
        }
        super(defaults);
        this.type = "decl";
      }
    };
    module.exports = Declaration;
    Declaration.default = Declaration;
  }
});

// node_modules/postcss/lib/container.js
var require_container = __commonJS({
  "node_modules/postcss/lib/container.js"(exports, module) {
    "use strict";
    var Comment3 = require_comment();
    var Declaration = require_declaration();
    var Node2 = require_node();
    var { isClean, my } = require_symbols();
    var AtRule;
    var parse2;
    var Root2;
    var Rule;
    function cleanSource(nodes) {
      let stack = nodes.slice();
      while (stack.length > 0) {
        let node = stack.pop();
        delete node.source;
        if (node.nodes) {
          node.nodes = node.nodes.slice();
          for (let i of node.nodes) stack.push(i);
        }
      }
      return nodes.slice();
    }
    function markTreeDirty(node) {
      let stack = [node];
      while (stack.length > 0) {
        let next = stack.pop();
        next[isClean] = false;
        if (next.proxyOf.nodes) {
          for (let i of next.proxyOf.nodes) stack.push(i);
        }
      }
    }
    var Container = class _Container extends Node2 {
      get first() {
        if (!this.proxyOf.nodes) return void 0;
        return this.proxyOf.nodes[0];
      }
      get last() {
        if (!this.proxyOf.nodes) return void 0;
        return this.proxyOf.nodes[this.proxyOf.nodes.length - 1];
      }
      append(...children) {
        for (let child of children) {
          let nodes = this.normalize(child, this.last);
          for (let node of nodes) this.proxyOf.nodes.push(node);
        }
        this.markDirty();
        return this;
      }
      cleanRaws(keepBetween) {
        let stack = [this];
        while (stack.length > 0) {
          let node = stack.pop();
          if (node !== this && node.cleanRaws !== _Container.prototype.cleanRaws) {
            node.cleanRaws(keepBetween);
            continue;
          }
          Node2.prototype.cleanRaws.call(node, keepBetween);
          if (node.nodes) {
            for (let child of node.nodes) stack.push(child);
          }
        }
      }
      each(callback) {
        if (!this.proxyOf.nodes) return void 0;
        let iterator = this.getIterator();
        let index, result;
        while (this.indexes[iterator] < this.proxyOf.nodes.length) {
          index = this.indexes[iterator];
          result = callback(this.proxyOf.nodes[index], index);
          if (result === false) break;
          this.indexes[iterator] += 1;
        }
        delete this.indexes[iterator];
        return result;
      }
      every(condition) {
        return this.nodes.every(condition);
      }
      getIterator() {
        if (!this.lastEach) this.lastEach = 0;
        if (!this.indexes) this.indexes = {};
        this.lastEach += 1;
        let iterator = this.lastEach;
        this.indexes[iterator] = 0;
        return iterator;
      }
      getProxyProcessor() {
        return {
          get(node, prop) {
            if (prop === "proxyOf") {
              return node;
            } else if (!node[prop]) {
              return node[prop];
            } else if (prop === "each" || typeof prop === "string" && prop.startsWith("walk")) {
              return (...args) => {
                return node[prop](
                  ...args.map((i) => {
                    if (typeof i === "function") {
                      return (child, index) => i(child.toProxy(), index);
                    } else {
                      return i;
                    }
                  })
                );
              };
            } else if (prop === "every" || prop === "some") {
              return (cb) => {
                return node[prop](
                  (child, ...other) => cb(child.toProxy(), ...other)
                );
              };
            } else if (prop === "root") {
              return () => node.root().toProxy();
            } else if (prop === "nodes") {
              return node.nodes.map((i) => i.toProxy());
            } else if (prop === "first" || prop === "last") {
              return node[prop].toProxy();
            } else {
              return node[prop];
            }
          },
          set(node, prop, value) {
            if (node[prop] === value) return true;
            node[prop] = value;
            if (prop === "name" || prop === "params" || prop === "selector") {
              node.markDirty();
            }
            return true;
          }
        };
      }
      index(child) {
        if (typeof child === "number") return child;
        if (child.proxyOf) child = child.proxyOf;
        return this.proxyOf.nodes.indexOf(child);
      }
      insertAfter(exist, add) {
        let existIndex = this.index(exist);
        let nodes = this.normalize(add, this.proxyOf.nodes[existIndex]).reverse();
        existIndex = this.index(exist);
        for (let node of nodes) this.proxyOf.nodes.splice(existIndex + 1, 0, node);
        let index;
        for (let id in this.indexes) {
          index = this.indexes[id];
          if (existIndex < index) {
            this.indexes[id] = index + nodes.length;
          }
        }
        this.markDirty();
        return this;
      }
      insertBefore(exist, add) {
        let existIndex = this.index(exist);
        let type = existIndex === 0 ? "prepend" : false;
        let nodes = this.normalize(
          add,
          this.proxyOf.nodes[existIndex],
          type
        ).reverse();
        existIndex = this.index(exist);
        for (let node of nodes) this.proxyOf.nodes.splice(existIndex, 0, node);
        let index;
        for (let id in this.indexes) {
          index = this.indexes[id];
          if (existIndex <= index) {
            this.indexes[id] = index + nodes.length;
          }
        }
        this.markDirty();
        return this;
      }
      normalize(nodes, sample) {
        if (typeof nodes === "string") {
          nodes = cleanSource(parse2(nodes).nodes);
        } else if (typeof nodes === "undefined") {
          nodes = [];
        } else if (Array.isArray(nodes)) {
          nodes = nodes.slice(0);
          for (let i of nodes) {
            if (i.parent) i.parent.removeChild(i, "ignore");
          }
        } else if (nodes.type === "root" && this.type !== "document") {
          nodes = nodes.nodes.slice(0);
          for (let i of nodes) {
            if (i.parent) i.parent.removeChild(i, "ignore");
          }
        } else if (nodes.type) {
          nodes = [nodes];
        } else if (nodes.prop) {
          if (typeof nodes.value === "undefined") {
            throw new Error("Value field is missed in node creation");
          } else if (typeof nodes.value !== "string") {
            nodes.value = String(nodes.value);
          }
          nodes = [new Declaration(nodes)];
        } else if (nodes.selector || nodes.selectors) {
          nodes = [new Rule(nodes)];
        } else if (nodes.name) {
          nodes = [new AtRule(nodes)];
        } else if (nodes.text) {
          nodes = [new Comment3(nodes)];
        } else {
          throw new Error("Unknown node type in node creation");
        }
        let processed = nodes.map((i) => {
          if (!i[my]) _Container.rebuild(i);
          i = i.proxyOf;
          if (i.parent) i.parent.removeChild(i);
          if (i[isClean]) markTreeDirty(i);
          if (!i.raws) i.raws = {};
          if (typeof i.raws.before === "undefined") {
            if (sample && typeof sample.raws.before !== "undefined") {
              i.raws.before = sample.raws.before.replace(/\S/g, "");
            }
          }
          i.parent = this.proxyOf;
          return i;
        });
        return processed;
      }
      prepend(...children) {
        children = children.reverse();
        for (let child of children) {
          let nodes = this.normalize(child, this.first, "prepend").reverse();
          for (let node of nodes) this.proxyOf.nodes.unshift(node);
          for (let id in this.indexes) {
            this.indexes[id] = this.indexes[id] + nodes.length;
          }
        }
        this.markDirty();
        return this;
      }
      push(child) {
        child.parent = this;
        this.proxyOf.nodes.push(child);
        return this;
      }
      removeAll() {
        for (let node of this.proxyOf.nodes) node.parent = void 0;
        this.proxyOf.nodes = [];
        this.markDirty();
        return this;
      }
      removeChild(child) {
        child = this.index(child);
        this.proxyOf.nodes[child].parent = void 0;
        this.proxyOf.nodes.splice(child, 1);
        let index;
        for (let id in this.indexes) {
          index = this.indexes[id];
          if (index >= child) {
            this.indexes[id] = index - 1;
          }
        }
        this.markDirty();
        return this;
      }
      replaceValues(pattern, opts, callback) {
        if (!callback) {
          callback = opts;
          opts = {};
        }
        this.walkDecls((decl) => {
          if (opts.props && !opts.props.includes(decl.prop)) return;
          if (opts.fast && !decl.value.includes(opts.fast)) return;
          decl.value = decl.value.replace(pattern, callback);
        });
        this.markDirty();
        return this;
      }
      some(condition) {
        return this.nodes.some(condition);
      }
      walk(callback) {
        if (!this.proxyOf.nodes) return void 0;
        let stack = [{ iterator: this.getIterator(), node: this.proxyOf }];
        while (stack.length > 0) {
          let { iterator, node } = stack[stack.length - 1];
          let index = node.indexes[iterator];
          if (index >= node.proxyOf.nodes.length) {
            delete node.indexes[iterator];
            stack.pop();
            let parent = stack[stack.length - 1];
            if (parent) parent.node.indexes[parent.iterator] += 1;
            continue;
          }
          let child = node.proxyOf.nodes[index];
          let result;
          try {
            result = callback(child, index);
          } catch (e) {
            throw child.addToError(e);
          }
          if (result === false) {
            for (let opened of stack) {
              delete opened.node.indexes[opened.iterator];
            }
            return false;
          }
          if (child.walk && child.proxyOf.nodes) {
            stack.push({ iterator: child.getIterator(), node: child });
          } else {
            node.indexes[iterator] += 1;
          }
        }
        return void 0;
      }
      walkAtRules(name, callback) {
        if (!callback) {
          callback = name;
          return this.walk((child, i) => {
            if (child.type === "atrule") {
              return callback(child, i);
            }
          });
        }
        if (name instanceof RegExp) {
          return this.walk((child, i) => {
            if (child.type === "atrule" && name.test(child.name)) {
              return callback(child, i);
            }
          });
        }
        return this.walk((child, i) => {
          if (child.type === "atrule" && child.name === name) {
            return callback(child, i);
          }
        });
      }
      walkComments(callback) {
        return this.walk((child, i) => {
          if (child.type === "comment") {
            return callback(child, i);
          }
        });
      }
      walkDecls(prop, callback) {
        if (!callback) {
          callback = prop;
          return this.walk((child, i) => {
            if (child.type === "decl") {
              return callback(child, i);
            }
          });
        }
        if (prop instanceof RegExp) {
          return this.walk((child, i) => {
            if (child.type === "decl" && prop.test(child.prop)) {
              return callback(child, i);
            }
          });
        }
        return this.walk((child, i) => {
          if (child.type === "decl" && child.prop === prop) {
            return callback(child, i);
          }
        });
      }
      walkRules(selector, callback) {
        if (!callback) {
          callback = selector;
          return this.walk((child, i) => {
            if (child.type === "rule") {
              return callback(child, i);
            }
          });
        }
        if (selector instanceof RegExp) {
          return this.walk((child, i) => {
            if (child.type === "rule" && selector.test(child.selector)) {
              return callback(child, i);
            }
          });
        }
        return this.walk((child, i) => {
          if (child.type === "rule" && child.selector === selector) {
            return callback(child, i);
          }
        });
      }
    };
    Container.registerParse = (dependant) => {
      parse2 = dependant;
    };
    Container.registerRule = (dependant) => {
      Rule = dependant;
    };
    Container.registerAtRule = (dependant) => {
      AtRule = dependant;
    };
    Container.registerRoot = (dependant) => {
      Root2 = dependant;
    };
    module.exports = Container;
    Container.default = Container;
    Container.rebuild = (node) => {
      let stack = [node];
      while (stack.length > 0) {
        let next = stack.pop();
        if (next.type === "atrule") {
          Object.setPrototypeOf(next, AtRule.prototype);
        } else if (next.type === "rule") {
          Object.setPrototypeOf(next, Rule.prototype);
        } else if (next.type === "decl") {
          Object.setPrototypeOf(next, Declaration.prototype);
        } else if (next.type === "comment") {
          Object.setPrototypeOf(next, Comment3.prototype);
        } else if (next.type === "root") {
          Object.setPrototypeOf(next, Root2.prototype);
        }
        next[my] = true;
        if (next.nodes) {
          for (let child of next.nodes) stack.push(child);
        }
      }
    };
  }
});

// node_modules/postcss/lib/at-rule.js
var require_at_rule = __commonJS({
  "node_modules/postcss/lib/at-rule.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var AtRule = class extends Container {
      constructor(defaults) {
        super(defaults);
        this.type = "atrule";
      }
      append(...children) {
        if (!this.proxyOf.nodes) this.nodes = [];
        return super.append(...children);
      }
      prepend(...children) {
        if (!this.proxyOf.nodes) this.nodes = [];
        return super.prepend(...children);
      }
    };
    module.exports = AtRule;
    AtRule.default = AtRule;
    Container.registerAtRule(AtRule);
  }
});

// node_modules/postcss/lib/document.js
var require_document = __commonJS({
  "node_modules/postcss/lib/document.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var LazyResult;
    var Processor;
    var Document2 = class extends Container {
      constructor(defaults) {
        super({ type: "document", ...defaults });
        if (!this.nodes) {
          this.nodes = [];
        }
      }
      toResult(opts = {}) {
        let lazy = new LazyResult(new Processor(), this, opts);
        return lazy.stringify();
      }
    };
    Document2.registerLazyResult = (dependant) => {
      LazyResult = dependant;
    };
    Document2.registerProcessor = (dependant) => {
      Processor = dependant;
    };
    module.exports = Document2;
    Document2.default = Document2;
  }
});

// node_modules/nanoid/non-secure/index.cjs
var require_non_secure = __commonJS({
  "node_modules/nanoid/non-secure/index.cjs"(exports, module) {
    var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
    var customAlphabet = (alphabet, defaultSize = 21) => {
      return (size2 = defaultSize) => {
        let id = "";
        let i = size2 | 0;
        while (i-- > 0) {
          id += alphabet[Math.random() * alphabet.length | 0];
        }
        return id;
      };
    };
    var nanoid = (size2 = 21) => {
      let id = "";
      let i = size2 | 0;
      while (i-- > 0) {
        id += urlAlphabet[Math.random() * 64 | 0];
      }
      return id;
    };
    module.exports = { nanoid, customAlphabet };
  }
});

// node_modules/source-map-js/lib/base64.js
var require_base64 = __commonJS({
  "node_modules/source-map-js/lib/base64.js"(exports) {
    var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    exports.encode = function(number) {
      if (0 <= number && number < intToCharMap.length) {
        return intToCharMap[number];
      }
      throw new TypeError("Must be between 0 and 63: " + number);
    };
    exports.decode = function(charCode) {
      var bigA = 65;
      var bigZ = 90;
      var littleA = 97;
      var littleZ = 122;
      var zero = 48;
      var nine = 57;
      var plus = 43;
      var slash = 47;
      var littleOffset = 26;
      var numberOffset = 52;
      if (bigA <= charCode && charCode <= bigZ) {
        return charCode - bigA;
      }
      if (littleA <= charCode && charCode <= littleZ) {
        return charCode - littleA + littleOffset;
      }
      if (zero <= charCode && charCode <= nine) {
        return charCode - zero + numberOffset;
      }
      if (charCode == plus) {
        return 62;
      }
      if (charCode == slash) {
        return 63;
      }
      return -1;
    };
  }
});

// node_modules/source-map-js/lib/base64-vlq.js
var require_base64_vlq = __commonJS({
  "node_modules/source-map-js/lib/base64-vlq.js"(exports) {
    var base64 = require_base64();
    var VLQ_BASE_SHIFT = 5;
    var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
    var VLQ_BASE_MASK = VLQ_BASE - 1;
    var VLQ_CONTINUATION_BIT = VLQ_BASE;
    function toVLQSigned(aValue) {
      return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
    }
    function fromVLQSigned(aValue) {
      var isNegative = (aValue & 1) === 1;
      var shifted = aValue >> 1;
      return isNegative ? -shifted : shifted;
    }
    exports.encode = function base64VLQ_encode(aValue) {
      var encoded = "";
      var digit;
      var vlq = toVLQSigned(aValue);
      do {
        digit = vlq & VLQ_BASE_MASK;
        vlq >>>= VLQ_BASE_SHIFT;
        if (vlq > 0) {
          digit |= VLQ_CONTINUATION_BIT;
        }
        encoded += base64.encode(digit);
      } while (vlq > 0);
      return encoded;
    };
    exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
      var strLen = aStr.length;
      var result = 0;
      var shift = 0;
      var continuation, digit;
      do {
        if (aIndex >= strLen) {
          throw new Error("Expected more digits in base 64 VLQ value.");
        }
        digit = base64.decode(aStr.charCodeAt(aIndex++));
        if (digit === -1) {
          throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
        }
        continuation = !!(digit & VLQ_CONTINUATION_BIT);
        digit &= VLQ_BASE_MASK;
        result = result + (digit << shift);
        shift += VLQ_BASE_SHIFT;
      } while (continuation);
      aOutParam.value = fromVLQSigned(result);
      aOutParam.rest = aIndex;
    };
  }
});

// node_modules/source-map-js/lib/util.js
var require_util = __commonJS({
  "node_modules/source-map-js/lib/util.js"(exports) {
    function getArg(aArgs, aName, aDefaultValue) {
      if (aName in aArgs) {
        return aArgs[aName];
      } else if (arguments.length === 3) {
        return aDefaultValue;
      } else {
        throw new Error('"' + aName + '" is a required argument.');
      }
    }
    exports.getArg = getArg;
    var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
    var dataUrlRegexp = /^data:.+\,.+$/;
    function urlParse(aUrl) {
      var match = aUrl.match(urlRegexp);
      if (!match) {
        return null;
      }
      return {
        scheme: match[1],
        auth: match[2],
        host: match[3],
        port: match[4],
        path: match[5]
      };
    }
    exports.urlParse = urlParse;
    function urlGenerate(aParsedUrl) {
      var url = "";
      if (aParsedUrl.scheme) {
        url += aParsedUrl.scheme + ":";
      }
      url += "//";
      if (aParsedUrl.auth) {
        url += aParsedUrl.auth + "@";
      }
      if (aParsedUrl.host) {
        url += aParsedUrl.host;
      }
      if (aParsedUrl.port) {
        url += ":" + aParsedUrl.port;
      }
      if (aParsedUrl.path) {
        url += aParsedUrl.path;
      }
      return url;
    }
    exports.urlGenerate = urlGenerate;
    var MAX_CACHED_INPUTS = 32;
    function lruMemoize(f) {
      var cache = [];
      return function(input) {
        for (var i = 0; i < cache.length; i++) {
          if (cache[i].input === input) {
            var temp = cache[0];
            cache[0] = cache[i];
            cache[i] = temp;
            return cache[0].result;
          }
        }
        var result = f(input);
        cache.unshift({
          input,
          result
        });
        if (cache.length > MAX_CACHED_INPUTS) {
          cache.pop();
        }
        return result;
      };
    }
    var normalize2 = lruMemoize(function normalize3(aPath) {
      var path = aPath;
      var url = urlParse(aPath);
      if (url) {
        if (!url.path) {
          return aPath;
        }
        path = url.path;
      }
      var isAbsolute = exports.isAbsolute(path);
      var parts = [];
      var start = 0;
      var i = 0;
      while (true) {
        start = i;
        i = path.indexOf("/", start);
        if (i === -1) {
          parts.push(path.slice(start));
          break;
        } else {
          parts.push(path.slice(start, i));
          while (i < path.length && path[i] === "/") {
            i++;
          }
        }
      }
      for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
        part = parts[i];
        if (part === ".") {
          parts.splice(i, 1);
        } else if (part === "..") {
          up++;
        } else if (up > 0) {
          if (part === "") {
            parts.splice(i + 1, up);
            up = 0;
          } else {
            parts.splice(i, 2);
            up--;
          }
        }
      }
      path = parts.join("/");
      if (path === "") {
        path = isAbsolute ? "/" : ".";
      }
      if (url) {
        url.path = path;
        return urlGenerate(url);
      }
      return path;
    });
    exports.normalize = normalize2;
    function join(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      if (aPath === "") {
        aPath = ".";
      }
      var aPathUrl = urlParse(aPath);
      var aRootUrl = urlParse(aRoot);
      if (aRootUrl) {
        aRoot = aRootUrl.path || "/";
      }
      if (aPathUrl && !aPathUrl.scheme) {
        if (aRootUrl) {
          aPathUrl.scheme = aRootUrl.scheme;
        }
        return urlGenerate(aPathUrl);
      }
      if (aPathUrl || aPath.match(dataUrlRegexp)) {
        return aPath;
      }
      if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
        aRootUrl.host = aPath;
        return urlGenerate(aRootUrl);
      }
      var joined = aPath.charAt(0) === "/" ? aPath : normalize2(aRoot.replace(/\/+$/, "") + "/" + aPath);
      if (aRootUrl) {
        aRootUrl.path = joined;
        return urlGenerate(aRootUrl);
      }
      return joined;
    }
    exports.join = join;
    exports.isAbsolute = function(aPath) {
      return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
    };
    function relative(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      aRoot = aRoot.replace(/\/$/, "");
      var level = 0;
      while (aPath.indexOf(aRoot + "/") !== 0) {
        var index = aRoot.lastIndexOf("/");
        if (index < 0) {
          return aPath;
        }
        aRoot = aRoot.slice(0, index);
        if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
          return aPath;
        }
        ++level;
      }
      return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
    }
    exports.relative = relative;
    var supportsNullProto = (function() {
      var obj = /* @__PURE__ */ Object.create(null);
      return !("__proto__" in obj);
    })();
    function identity(s) {
      return s;
    }
    function toSetString(aStr) {
      if (isProtoString(aStr)) {
        return "$" + aStr;
      }
      return aStr;
    }
    exports.toSetString = supportsNullProto ? identity : toSetString;
    function fromSetString(aStr) {
      if (isProtoString(aStr)) {
        return aStr.slice(1);
      }
      return aStr;
    }
    exports.fromSetString = supportsNullProto ? identity : fromSetString;
    function isProtoString(s) {
      if (!s) {
        return false;
      }
      var length = s.length;
      if (length < 9) {
        return false;
      }
      if (s.charCodeAt(length - 1) !== 95 || s.charCodeAt(length - 2) !== 95 || s.charCodeAt(length - 3) !== 111 || s.charCodeAt(length - 4) !== 116 || s.charCodeAt(length - 5) !== 111 || s.charCodeAt(length - 6) !== 114 || s.charCodeAt(length - 7) !== 112 || s.charCodeAt(length - 8) !== 95 || s.charCodeAt(length - 9) !== 95) {
        return false;
      }
      for (var i = length - 10; i >= 0; i--) {
        if (s.charCodeAt(i) !== 36) {
          return false;
        }
      }
      return true;
    }
    function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
      var cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0 || onlyCompareOriginal) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByOriginalPositions = compareByOriginalPositions;
    function compareByOriginalPositionsNoSource(mappingA, mappingB, onlyCompareOriginal) {
      var cmp;
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0 || onlyCompareOriginal) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByOriginalPositionsNoSource = compareByOriginalPositionsNoSource;
    function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0 || onlyCompareGenerated) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
    function compareByGeneratedPositionsDeflatedNoLine(mappingA, mappingB, onlyCompareGenerated) {
      var cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0 || onlyCompareGenerated) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsDeflatedNoLine = compareByGeneratedPositionsDeflatedNoLine;
    function strcmp(aStr1, aStr2) {
      if (aStr1 === aStr2) {
        return 0;
      }
      if (aStr1 === null) {
        return 1;
      }
      if (aStr2 === null) {
        return -1;
      }
      if (aStr1 > aStr2) {
        return 1;
      }
      return -1;
    }
    function compareByGeneratedPositionsInflated(mappingA, mappingB) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
    function parseSourceMapInput(str2) {
      return JSON.parse(str2.replace(/^\)]}'[^\n]*\n/, ""));
    }
    exports.parseSourceMapInput = parseSourceMapInput;
    function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
      sourceURL = sourceURL || "";
      if (sourceRoot) {
        if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") {
          sourceRoot += "/";
        }
        sourceURL = sourceRoot + sourceURL;
      }
      if (sourceMapURL) {
        var parsed = urlParse(sourceMapURL);
        if (!parsed) {
          throw new Error("sourceMapURL could not be parsed");
        }
        if (parsed.path) {
          var index = parsed.path.lastIndexOf("/");
          if (index >= 0) {
            parsed.path = parsed.path.substring(0, index + 1);
          }
        }
        sourceURL = join(urlGenerate(parsed), sourceURL);
      }
      return normalize2(sourceURL);
    }
    exports.computeSourceURL = computeSourceURL;
  }
});

// node_modules/source-map-js/lib/array-set.js
var require_array_set = __commonJS({
  "node_modules/source-map-js/lib/array-set.js"(exports) {
    var util = require_util();
    var has = Object.prototype.hasOwnProperty;
    var hasNativeMap = typeof Map !== "undefined";
    function ArraySet() {
      this._array = [];
      this._set = hasNativeMap ? /* @__PURE__ */ new Map() : /* @__PURE__ */ Object.create(null);
    }
    ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
      var set = new ArraySet();
      for (var i = 0, len = aArray.length; i < len; i++) {
        set.add(aArray[i], aAllowDuplicates);
      }
      return set;
    };
    ArraySet.prototype.size = function ArraySet_size() {
      return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
    };
    ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
      var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
      var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
      var idx = this._array.length;
      if (!isDuplicate || aAllowDuplicates) {
        this._array.push(aStr);
      }
      if (!isDuplicate) {
        if (hasNativeMap) {
          this._set.set(aStr, idx);
        } else {
          this._set[sStr] = idx;
        }
      }
    };
    ArraySet.prototype.has = function ArraySet_has(aStr) {
      if (hasNativeMap) {
        return this._set.has(aStr);
      } else {
        var sStr = util.toSetString(aStr);
        return has.call(this._set, sStr);
      }
    };
    ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
      if (hasNativeMap) {
        var idx = this._set.get(aStr);
        if (idx >= 0) {
          return idx;
        }
      } else {
        var sStr = util.toSetString(aStr);
        if (has.call(this._set, sStr)) {
          return this._set[sStr];
        }
      }
      throw new Error('"' + aStr + '" is not in the set.');
    };
    ArraySet.prototype.at = function ArraySet_at(aIdx) {
      if (aIdx >= 0 && aIdx < this._array.length) {
        return this._array[aIdx];
      }
      throw new Error("No element indexed by " + aIdx);
    };
    ArraySet.prototype.toArray = function ArraySet_toArray() {
      return this._array.slice();
    };
    exports.ArraySet = ArraySet;
  }
});

// node_modules/source-map-js/lib/mapping-list.js
var require_mapping_list = __commonJS({
  "node_modules/source-map-js/lib/mapping-list.js"(exports) {
    var util = require_util();
    function generatedPositionAfter(mappingA, mappingB) {
      var lineA = mappingA.generatedLine;
      var lineB = mappingB.generatedLine;
      var columnA = mappingA.generatedColumn;
      var columnB = mappingB.generatedColumn;
      return lineB > lineA || lineB == lineA && columnB >= columnA || util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
    }
    function MappingList() {
      this._array = [];
      this._sorted = true;
      this._last = { generatedLine: -1, generatedColumn: 0 };
    }
    MappingList.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
      this._array.forEach(aCallback, aThisArg);
    };
    MappingList.prototype.add = function MappingList_add(aMapping) {
      if (generatedPositionAfter(this._last, aMapping)) {
        this._last = aMapping;
        this._array.push(aMapping);
      } else {
        this._sorted = false;
        this._array.push(aMapping);
      }
    };
    MappingList.prototype.toArray = function MappingList_toArray() {
      if (!this._sorted) {
        this._array.sort(util.compareByGeneratedPositionsInflated);
        this._sorted = true;
      }
      return this._array;
    };
    exports.MappingList = MappingList;
  }
});

// node_modules/source-map-js/lib/source-map-generator.js
var require_source_map_generator = __commonJS({
  "node_modules/source-map-js/lib/source-map-generator.js"(exports) {
    var base64VLQ = require_base64_vlq();
    var util = require_util();
    var ArraySet = require_array_set().ArraySet;
    var MappingList = require_mapping_list().MappingList;
    function SourceMapGenerator(aArgs) {
      if (!aArgs) {
        aArgs = {};
      }
      this._file = util.getArg(aArgs, "file", null);
      this._sourceRoot = util.getArg(aArgs, "sourceRoot", null);
      this._skipValidation = util.getArg(aArgs, "skipValidation", false);
      this._ignoreInvalidMapping = util.getArg(aArgs, "ignoreInvalidMapping", false);
      this._sources = new ArraySet();
      this._names = new ArraySet();
      this._mappings = new MappingList();
      this._sourcesContents = null;
    }
    SourceMapGenerator.prototype._version = 3;
    SourceMapGenerator.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer, generatorOps) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator(Object.assign(generatorOps || {}, {
        file: aSourceMapConsumer.file,
        sourceRoot
      }));
      aSourceMapConsumer.eachMapping(function(mapping) {
        var newMapping = {
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }
        };
        if (mapping.source != null) {
          newMapping.source = mapping.source;
          if (sourceRoot != null) {
            newMapping.source = util.relative(sourceRoot, newMapping.source);
          }
          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };
          if (mapping.name != null) {
            newMapping.name = mapping.name;
          }
        }
        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var sourceRelative = sourceFile;
        if (sourceRoot !== null) {
          sourceRelative = util.relative(sourceRoot, sourceFile);
        }
        if (!generator._sources.has(sourceRelative)) {
          generator._sources.add(sourceRelative);
        }
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    };
    SourceMapGenerator.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
      var generated = util.getArg(aArgs, "generated");
      var original = util.getArg(aArgs, "original", null);
      var source = util.getArg(aArgs, "source", null);
      var name = util.getArg(aArgs, "name", null);
      if (!this._skipValidation) {
        if (this._validateMapping(generated, original, source, name) === false) {
          return;
        }
      }
      if (source != null) {
        source = String(source);
        if (!this._sources.has(source)) {
          this._sources.add(source);
        }
      }
      if (name != null) {
        name = String(name);
        if (!this._names.has(name)) {
          this._names.add(name);
        }
      }
      this._mappings.add({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source,
        name
      });
    };
    SourceMapGenerator.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot != null) {
        source = util.relative(this._sourceRoot, source);
      }
      if (aSourceContent != null) {
        if (!this._sourcesContents) {
          this._sourcesContents = /* @__PURE__ */ Object.create(null);
        }
        this._sourcesContents[util.toSetString(source)] = aSourceContent;
      } else if (this._sourcesContents) {
        delete this._sourcesContents[util.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    };
    SourceMapGenerator.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
      var sourceFile = aSourceFile;
      if (aSourceFile == null) {
        if (aSourceMapConsumer.file == null) {
          throw new Error(
            `SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`
          );
        }
        sourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      if (sourceRoot != null) {
        sourceFile = util.relative(sourceRoot, sourceFile);
      }
      var newSources = new ArraySet();
      var newNames = new ArraySet();
      this._mappings.unsortedForEach(function(mapping) {
        if (mapping.source === sourceFile && mapping.originalLine != null) {
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source != null) {
            mapping.source = original.source;
            if (aSourceMapPath != null) {
              mapping.source = util.join(aSourceMapPath, mapping.source);
            }
            if (sourceRoot != null) {
              mapping.source = util.relative(sourceRoot, mapping.source);
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name != null) {
              mapping.name = original.name;
            }
          }
        }
        var source = mapping.source;
        if (source != null && !newSources.has(source)) {
          newSources.add(source);
        }
        var name = mapping.name;
        if (name != null && !newNames.has(name)) {
          newNames.add(name);
        }
      }, this);
      this._sources = newSources;
      this._names = newNames;
      aSourceMapConsumer.sources.forEach(function(sourceFile2) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile2);
        if (content != null) {
          if (aSourceMapPath != null) {
            sourceFile2 = util.join(aSourceMapPath, sourceFile2);
          }
          if (sourceRoot != null) {
            sourceFile2 = util.relative(sourceRoot, sourceFile2);
          }
          this.setSourceContent(sourceFile2, content);
        }
      }, this);
    };
    SourceMapGenerator.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
      if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
        var message = "original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.";
        if (this._ignoreInvalidMapping) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn(message);
          }
          return false;
        } else {
          throw new Error(message);
        }
      }
      if (aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
        return;
      } else if (aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
        return;
      } else {
        var message = "Invalid mapping: " + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          original: aOriginal,
          name: aName
        });
        if (this._ignoreInvalidMapping) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn(message);
          }
          return false;
        } else {
          throw new Error(message);
        }
      }
    };
    SourceMapGenerator.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = "";
      var next;
      var mapping;
      var nameIdx;
      var sourceIdx;
      var mappings = this._mappings.toArray();
      for (var i = 0, len = mappings.length; i < len; i++) {
        mapping = mappings[i];
        next = "";
        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          var lineDelta = mapping.generatedLine - previousGeneratedLine;
          next += lineDelta === 1 ? ";" : ";".repeat(lineDelta);
          previousGeneratedLine = mapping.generatedLine;
        } else {
          if (i > 0) {
            if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
              continue;
            }
            next += ",";
          }
        }
        next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;
        if (mapping.source != null) {
          sourceIdx = this._sources.indexOf(mapping.source);
          next += base64VLQ.encode(sourceIdx - previousSource);
          previousSource = sourceIdx;
          next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;
          next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;
          if (mapping.name != null) {
            nameIdx = this._names.indexOf(mapping.name);
            next += base64VLQ.encode(nameIdx - previousName);
            previousName = nameIdx;
          }
        }
        result += next;
      }
      return result;
    };
    SourceMapGenerator.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function(source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot != null) {
          source = util.relative(aSourceRoot, source);
        }
        var key = util.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
      }, this);
    };
    SourceMapGenerator.prototype.toJSON = function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._file != null) {
        map.file = this._file;
      }
      if (this._sourceRoot != null) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }
      return map;
    };
    SourceMapGenerator.prototype.toString = function SourceMapGenerator_toString() {
      return JSON.stringify(this.toJSON());
    };
    exports.SourceMapGenerator = SourceMapGenerator;
  }
});

// node_modules/source-map-js/lib/binary-search.js
var require_binary_search = __commonJS({
  "node_modules/source-map-js/lib/binary-search.js"(exports) {
    exports.GREATEST_LOWER_BOUND = 1;
    exports.LEAST_UPPER_BOUND = 2;
    function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
      var mid = Math.floor((aHigh - aLow) / 2) + aLow;
      var cmp = aCompare(aNeedle, aHaystack[mid], true);
      if (cmp === 0) {
        return mid;
      } else if (cmp > 0) {
        if (aHigh - mid > 1) {
          return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
        }
        if (aBias == exports.LEAST_UPPER_BOUND) {
          return aHigh < aHaystack.length ? aHigh : -1;
        } else {
          return mid;
        }
      } else {
        if (mid - aLow > 1) {
          return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
        }
        if (aBias == exports.LEAST_UPPER_BOUND) {
          return mid;
        } else {
          return aLow < 0 ? -1 : aLow;
        }
      }
    }
    exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
      if (aHaystack.length === 0) {
        return -1;
      }
      var index = recursiveSearch(
        -1,
        aHaystack.length,
        aNeedle,
        aHaystack,
        aCompare,
        aBias || exports.GREATEST_LOWER_BOUND
      );
      if (index < 0) {
        return -1;
      }
      while (index - 1 >= 0) {
        if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
          break;
        }
        --index;
      }
      return index;
    };
  }
});

// node_modules/source-map-js/lib/quick-sort.js
var require_quick_sort = __commonJS({
  "node_modules/source-map-js/lib/quick-sort.js"(exports) {
    function SortTemplate(comparator) {
      function swap(ary, x, y) {
        var temp = ary[x];
        ary[x] = ary[y];
        ary[y] = temp;
      }
      function randomIntInRange(low, high) {
        return Math.round(low + Math.random() * (high - low));
      }
      function doQuickSort(ary, comparator2, p, r) {
        if (p < r) {
          var pivotIndex = randomIntInRange(p, r);
          var i = p - 1;
          swap(ary, pivotIndex, r);
          var pivot = ary[r];
          for (var j = p; j < r; j++) {
            if (comparator2(ary[j], pivot, false) <= 0) {
              i += 1;
              swap(ary, i, j);
            }
          }
          swap(ary, i + 1, j);
          var q = i + 1;
          doQuickSort(ary, comparator2, p, q - 1);
          doQuickSort(ary, comparator2, q + 1, r);
        }
      }
      return doQuickSort;
    }
    function cloneSort(comparator) {
      let template = SortTemplate.toString();
      let templateFn = new Function(`return ${template}`)();
      return templateFn(comparator);
    }
    var isEvalAllowed = (function() {
      try {
        new Function("return 0")();
        return true;
      } catch {
        return false;
      }
    })();
    var sortCache = /* @__PURE__ */ new WeakMap();
    exports.quickSort = function(ary, comparator, start = 0) {
      let doQuickSort = isEvalAllowed ? sortCache.get(comparator) : SortTemplate(comparator);
      if (doQuickSort === void 0) {
        doQuickSort = cloneSort(comparator);
        sortCache.set(comparator, doQuickSort);
      }
      doQuickSort(ary, comparator, start, ary.length - 1);
    };
  }
});

// node_modules/source-map-js/lib/source-map-consumer.js
var require_source_map_consumer = __commonJS({
  "node_modules/source-map-js/lib/source-map-consumer.js"(exports) {
    var util = require_util();
    var binarySearch = require_binary_search();
    var ArraySet = require_array_set().ArraySet;
    var base64VLQ = require_base64_vlq();
    var quickSort = require_quick_sort().quickSort;
    var MAX_SECTION_OFFSET_LINE = 1e7;
    function SourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      return sourceMap.sections != null ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL) : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
    }
    SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
      return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
    };
    SourceMapConsumer.prototype._version = 3;
    SourceMapConsumer.prototype.__generatedMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, "_generatedMappings", {
      configurable: true,
      enumerable: true,
      get: function() {
        if (!this.__generatedMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }
        return this.__generatedMappings;
      }
    });
    SourceMapConsumer.prototype.__originalMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, "_originalMappings", {
      configurable: true,
      enumerable: true,
      get: function() {
        if (!this.__originalMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }
        return this.__originalMappings;
      }
    });
    SourceMapConsumer.prototype._charIsMappingSeparator = function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
      var c = aStr.charAt(index);
      return c === ";" || c === ",";
    };
    SourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      throw new Error("Subclasses must implement _parseMappings");
    };
    SourceMapConsumer.GENERATED_ORDER = 1;
    SourceMapConsumer.ORIGINAL_ORDER = 2;
    SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
    SourceMapConsumer.LEAST_UPPER_BOUND = 2;
    SourceMapConsumer.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
      var context = aContext || null;
      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
      var mappings;
      switch (order) {
        case SourceMapConsumer.GENERATED_ORDER:
          mappings = this._generatedMappings;
          break;
        case SourceMapConsumer.ORIGINAL_ORDER:
          mappings = this._originalMappings;
          break;
        default:
          throw new Error("Unknown order of iteration.");
      }
      var sourceRoot = this.sourceRoot;
      var boundCallback = aCallback.bind(context);
      var names = this._names;
      var sources = this._sources;
      var sourceMapURL = this._sourceMapURL;
      for (var i = 0, n = mappings.length; i < n; i++) {
        var mapping = mappings[i];
        var source = mapping.source === null ? null : sources.at(mapping.source);
        if (source !== null) {
          source = util.computeSourceURL(sourceRoot, source, sourceMapURL);
        }
        boundCallback({
          source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: mapping.name === null ? null : names.at(mapping.name)
        });
      }
    };
    SourceMapConsumer.prototype.allGeneratedPositionsFor = function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
      var line = util.getArg(aArgs, "line");
      var needle = {
        source: util.getArg(aArgs, "source"),
        originalLine: line,
        originalColumn: util.getArg(aArgs, "column", 0)
      };
      needle.source = this._findSourceIndex(needle.source);
      if (needle.source < 0) {
        return [];
      }
      var mappings = [];
      var index = this._findMapping(
        needle,
        this._originalMappings,
        "originalLine",
        "originalColumn",
        util.compareByOriginalPositions,
        binarySearch.LEAST_UPPER_BOUND
      );
      if (index >= 0) {
        var mapping = this._originalMappings[index];
        if (aArgs.column === void 0) {
          var originalLine = mapping.originalLine;
          while (mapping && mapping.originalLine === originalLine) {
            mappings.push({
              line: util.getArg(mapping, "generatedLine", null),
              column: util.getArg(mapping, "generatedColumn", null),
              lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
            });
            mapping = this._originalMappings[++index];
          }
        } else {
          var originalColumn = mapping.originalColumn;
          while (mapping && mapping.originalLine === line && mapping.originalColumn == originalColumn) {
            mappings.push({
              line: util.getArg(mapping, "generatedLine", null),
              column: util.getArg(mapping, "generatedColumn", null),
              lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
            });
            mapping = this._originalMappings[++index];
          }
        }
      }
      return mappings;
    };
    exports.SourceMapConsumer = SourceMapConsumer;
    function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      var version = util.getArg(sourceMap, "version");
      var sources = util.getArg(sourceMap, "sources");
      var names = util.getArg(sourceMap, "names", []);
      var sourceRoot = util.getArg(sourceMap, "sourceRoot", null);
      var sourcesContent = util.getArg(sourceMap, "sourcesContent", null);
      var mappings = util.getArg(sourceMap, "mappings");
      var file = util.getArg(sourceMap, "file", null);
      if (version != this._version) {
        throw new Error("Unsupported version: " + version);
      }
      if (sourceRoot) {
        sourceRoot = util.normalize(sourceRoot);
      }
      sources = sources.map(String).map(util.normalize).map(function(source) {
        return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source) ? util.relative(sourceRoot, source) : source;
      });
      this._names = ArraySet.fromArray(names.map(String), true);
      this._sources = ArraySet.fromArray(sources, true);
      this._absoluteSources = this._sources.toArray().map(function(s) {
        return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
      });
      this.sourceRoot = sourceRoot;
      this.sourcesContent = sourcesContent;
      this._mappings = mappings;
      this._sourceMapURL = aSourceMapURL;
      this.file = file;
    }
    BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
    BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;
    BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
      var relativeSource = aSource;
      if (this.sourceRoot != null) {
        relativeSource = util.relative(this.sourceRoot, relativeSource);
      }
      if (this._sources.has(relativeSource)) {
        return this._sources.indexOf(relativeSource);
      }
      var i;
      for (i = 0; i < this._absoluteSources.length; ++i) {
        if (this._absoluteSources[i] == aSource) {
          return i;
        }
      }
      return -1;
    };
    BasicSourceMapConsumer.fromSourceMap = function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
      var smc = Object.create(BasicSourceMapConsumer.prototype);
      var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
      var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
      smc.sourceRoot = aSourceMap._sourceRoot;
      smc.sourcesContent = aSourceMap._generateSourcesContent(
        smc._sources.toArray(),
        smc.sourceRoot
      );
      smc.file = aSourceMap._file;
      smc._sourceMapURL = aSourceMapURL;
      smc._absoluteSources = smc._sources.toArray().map(function(s) {
        return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
      });
      var generatedMappings = aSourceMap._mappings.toArray().slice();
      var destGeneratedMappings = smc.__generatedMappings = [];
      var destOriginalMappings = smc.__originalMappings = [];
      for (var i = 0, length = generatedMappings.length; i < length; i++) {
        var srcMapping = generatedMappings[i];
        var destMapping = new Mapping();
        destMapping.generatedLine = srcMapping.generatedLine;
        destMapping.generatedColumn = srcMapping.generatedColumn;
        if (srcMapping.source) {
          destMapping.source = sources.indexOf(srcMapping.source);
          destMapping.originalLine = srcMapping.originalLine;
          destMapping.originalColumn = srcMapping.originalColumn;
          if (srcMapping.name) {
            destMapping.name = names.indexOf(srcMapping.name);
          }
          destOriginalMappings.push(destMapping);
        }
        destGeneratedMappings.push(destMapping);
      }
      quickSort(smc.__originalMappings, util.compareByOriginalPositions);
      return smc;
    };
    BasicSourceMapConsumer.prototype._version = 3;
    Object.defineProperty(BasicSourceMapConsumer.prototype, "sources", {
      get: function() {
        return this._absoluteSources.slice();
      }
    });
    function Mapping() {
      this.generatedLine = 0;
      this.generatedColumn = 0;
      this.source = null;
      this.originalLine = null;
      this.originalColumn = null;
      this.name = null;
    }
    var compareGenerated = util.compareByGeneratedPositionsDeflatedNoLine;
    function sortGenerated(array, start) {
      let l = array.length;
      let n = array.length - start;
      if (n <= 1) {
        return;
      } else if (n == 2) {
        let a = array[start];
        let b2 = array[start + 1];
        if (compareGenerated(a, b2) > 0) {
          array[start] = b2;
          array[start + 1] = a;
        }
      } else if (n < 20) {
        for (let i = start; i < l; i++) {
          for (let j = i; j > start; j--) {
            let a = array[j - 1];
            let b2 = array[j];
            if (compareGenerated(a, b2) <= 0) {
              break;
            }
            array[j - 1] = b2;
            array[j] = a;
          }
        }
      } else {
        quickSort(array, compareGenerated, start);
      }
    }
    BasicSourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      var generatedLine = 1;
      var previousGeneratedColumn = 0;
      var previousOriginalLine = 0;
      var previousOriginalColumn = 0;
      var previousSource = 0;
      var previousName = 0;
      var length = aStr.length;
      var index = 0;
      var cachedSegments = {};
      var temp = {};
      var originalMappings = [];
      var generatedMappings = [];
      var mapping, str2, segment, end, value;
      let subarrayStart = 0;
      while (index < length) {
        if (aStr.charAt(index) === ";") {
          generatedLine++;
          index++;
          previousGeneratedColumn = 0;
          sortGenerated(generatedMappings, subarrayStart);
          subarrayStart = generatedMappings.length;
        } else if (aStr.charAt(index) === ",") {
          index++;
        } else {
          mapping = new Mapping();
          mapping.generatedLine = generatedLine;
          for (end = index; end < length; end++) {
            if (this._charIsMappingSeparator(aStr, end)) {
              break;
            }
          }
          str2 = aStr.slice(index, end);
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }
          if (segment.length === 2) {
            throw new Error("Found a source, but no line and column");
          }
          if (segment.length === 3) {
            throw new Error("Found a source and line, but no column");
          }
          mapping.generatedColumn = previousGeneratedColumn + segment[0];
          previousGeneratedColumn = mapping.generatedColumn;
          if (segment.length > 1) {
            mapping.source = previousSource + segment[1];
            previousSource += segment[1];
            mapping.originalLine = previousOriginalLine + segment[2];
            previousOriginalLine = mapping.originalLine;
            mapping.originalLine += 1;
            mapping.originalColumn = previousOriginalColumn + segment[3];
            previousOriginalColumn = mapping.originalColumn;
            if (segment.length > 4) {
              mapping.name = previousName + segment[4];
              previousName += segment[4];
            }
          }
          generatedMappings.push(mapping);
          if (typeof mapping.originalLine === "number") {
            let currentSource = mapping.source;
            while (originalMappings.length <= currentSource) {
              originalMappings.push(null);
            }
            if (originalMappings[currentSource] === null) {
              originalMappings[currentSource] = [];
            }
            originalMappings[currentSource].push(mapping);
          }
        }
      }
      sortGenerated(generatedMappings, subarrayStart);
      this.__generatedMappings = generatedMappings;
      for (var i = 0; i < originalMappings.length; i++) {
        if (originalMappings[i] != null) {
          quickSort(originalMappings[i], util.compareByOriginalPositionsNoSource);
        }
      }
      this.__originalMappings = [].concat(...originalMappings);
    };
    BasicSourceMapConsumer.prototype._findMapping = function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName, aColumnName, aComparator, aBias) {
      if (aNeedle[aLineName] <= 0) {
        throw new TypeError("Line must be greater than or equal to 1, got " + aNeedle[aLineName]);
      }
      if (aNeedle[aColumnName] < 0) {
        throw new TypeError("Column must be greater than or equal to 0, got " + aNeedle[aColumnName]);
      }
      return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
    };
    BasicSourceMapConsumer.prototype.computeColumnSpans = function SourceMapConsumer_computeColumnSpans() {
      for (var index = 0; index < this._generatedMappings.length; ++index) {
        var mapping = this._generatedMappings[index];
        if (index + 1 < this._generatedMappings.length) {
          var nextMapping = this._generatedMappings[index + 1];
          if (mapping.generatedLine === nextMapping.generatedLine) {
            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
            continue;
          }
        }
        mapping.lastGeneratedColumn = Infinity;
      }
    };
    BasicSourceMapConsumer.prototype.originalPositionFor = function SourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, "line"),
        generatedColumn: util.getArg(aArgs, "column")
      };
      var index = this._findMapping(
        needle,
        this._generatedMappings,
        "generatedLine",
        "generatedColumn",
        util.compareByGeneratedPositionsDeflated,
        util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND)
      );
      if (index >= 0) {
        var mapping = this._generatedMappings[index];
        if (mapping.generatedLine === needle.generatedLine) {
          var source = util.getArg(mapping, "source", null);
          if (source !== null) {
            source = this._sources.at(source);
            source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
          }
          var name = util.getArg(mapping, "name", null);
          if (name !== null) {
            name = this._names.at(name);
          }
          return {
            source,
            line: util.getArg(mapping, "originalLine", null),
            column: util.getArg(mapping, "originalColumn", null),
            name
          };
        }
      }
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    };
    BasicSourceMapConsumer.prototype.hasContentsOfAllSources = function BasicSourceMapConsumer_hasContentsOfAllSources() {
      if (!this.sourcesContent) {
        return false;
      }
      return this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(sc) {
        return sc == null;
      });
    };
    BasicSourceMapConsumer.prototype.sourceContentFor = function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      if (!this.sourcesContent) {
        return null;
      }
      var index = this._findSourceIndex(aSource);
      if (index >= 0) {
        return this.sourcesContent[index];
      }
      var relativeSource = aSource;
      if (this.sourceRoot != null) {
        relativeSource = util.relative(this.sourceRoot, relativeSource);
      }
      var url;
      if (this.sourceRoot != null && (url = util.urlParse(this.sourceRoot))) {
        var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
        if (url.scheme == "file" && this._sources.has(fileUriAbsPath)) {
          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
        }
        if ((!url.path || url.path == "/") && this._sources.has("/" + relativeSource)) {
          return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
        }
      }
      if (nullOnMissing) {
        return null;
      } else {
        throw new Error('"' + relativeSource + '" is not in the SourceMap.');
      }
    };
    BasicSourceMapConsumer.prototype.generatedPositionFor = function SourceMapConsumer_generatedPositionFor(aArgs) {
      var source = util.getArg(aArgs, "source");
      source = this._findSourceIndex(source);
      if (source < 0) {
        return {
          line: null,
          column: null,
          lastColumn: null
        };
      }
      var needle = {
        source,
        originalLine: util.getArg(aArgs, "line"),
        originalColumn: util.getArg(aArgs, "column")
      };
      var index = this._findMapping(
        needle,
        this._originalMappings,
        "originalLine",
        "originalColumn",
        util.compareByOriginalPositions,
        util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND)
      );
      if (index >= 0) {
        var mapping = this._originalMappings[index];
        if (mapping.source === needle.source) {
          return {
            line: util.getArg(mapping, "generatedLine", null),
            column: util.getArg(mapping, "generatedColumn", null),
            lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
          };
        }
      }
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    };
    exports.BasicSourceMapConsumer = BasicSourceMapConsumer;
    function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      var version = util.getArg(sourceMap, "version");
      var sections = util.getArg(sourceMap, "sections");
      if (version != this._version) {
        throw new Error("Unsupported version: " + version);
      }
      this._sources = new ArraySet();
      this._names = new ArraySet();
      var lastOffset = {
        line: -1,
        column: 0
      };
      var maxOffsetLine = 0;
      this._sections = sections.map(function(s) {
        if (s.url) {
          throw new Error("Support for url field in sections not implemented.");
        }
        var offset = util.getArg(s, "offset");
        var offsetLine = util.getArg(offset, "line");
        var offsetColumn = util.getArg(offset, "column");
        if (!isValidOffset(offsetLine) || !isValidOffset(offsetColumn)) {
          throw new Error("Section offset line and column must be non-negative integers.");
        }
        if (offsetLine > MAX_SECTION_OFFSET_LINE) {
          throw new Error("Section offset line must not exceed " + MAX_SECTION_OFFSET_LINE + ".");
        }
        if (offsetLine < lastOffset.line || offsetLine === lastOffset.line && offsetColumn < lastOffset.column) {
          throw new Error("Section offsets must be ordered and non-overlapping.");
        }
        lastOffset = offset;
        var consumer = new SourceMapConsumer(util.getArg(s, "map"), aSourceMapURL);
        var totalOffsetLine = offsetLine + (consumer._maxOffsetLine || 0);
        if (totalOffsetLine > MAX_SECTION_OFFSET_LINE) {
          throw new Error("Section offset line must not exceed " + MAX_SECTION_OFFSET_LINE + ", including offsets of nested sections.");
        }
        if (totalOffsetLine > maxOffsetLine) {
          maxOffsetLine = totalOffsetLine;
        }
        return {
          generatedOffset: {
            // The offset fields are 0-based, but we use 1-based indices when
            // encoding/decoding from VLQ.
            generatedLine: offsetLine + 1,
            generatedColumn: offsetColumn + 1
          },
          consumer
        };
      });
      this._maxOffsetLine = maxOffsetLine;
    }
    function isValidOffset(aValue) {
      return typeof aValue === "number" && aValue >= 0 && aValue <= 9007199254740991 && // Number.MAX_SAFE_INTEGER
      Math.floor(aValue) === aValue;
    }
    IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
    IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;
    IndexedSourceMapConsumer.prototype._version = 3;
    Object.defineProperty(IndexedSourceMapConsumer.prototype, "sources", {
      get: function() {
        var sources = [];
        for (var i = 0; i < this._sections.length; i++) {
          var sectionSources = this._sections[i].consumer.sources;
          for (var j = 0; j < sectionSources.length; j++) {
            sources.push(sectionSources[j]);
          }
        }
        return sources;
      }
    });
    IndexedSourceMapConsumer.prototype.originalPositionFor = function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, "line"),
        generatedColumn: util.getArg(aArgs, "column")
      };
      var sectionIndex = binarySearch.search(
        needle,
        this._sections,
        function(needle2, section3) {
          var cmp = needle2.generatedLine - section3.generatedOffset.generatedLine;
          if (cmp) {
            return cmp;
          }
          return needle2.generatedColumn - section3.generatedOffset.generatedColumn;
        }
      );
      var section2 = this._sections[sectionIndex];
      if (!section2) {
        return {
          source: null,
          line: null,
          column: null,
          name: null
        };
      }
      return section2.consumer.originalPositionFor({
        line: needle.generatedLine - (section2.generatedOffset.generatedLine - 1),
        column: needle.generatedColumn - (section2.generatedOffset.generatedLine === needle.generatedLine ? section2.generatedOffset.generatedColumn - 1 : 0),
        bias: aArgs.bias
      });
    };
    IndexedSourceMapConsumer.prototype.hasContentsOfAllSources = function IndexedSourceMapConsumer_hasContentsOfAllSources() {
      return this._sections.every(function(s) {
        return s.consumer.hasContentsOfAllSources();
      });
    };
    IndexedSourceMapConsumer.prototype.sourceContentFor = function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      for (var i = 0; i < this._sections.length; i++) {
        var section2 = this._sections[i];
        var content = section2.consumer.sourceContentFor(aSource, true);
        if (content || content === "") {
          return content;
        }
      }
      if (nullOnMissing) {
        return null;
      } else {
        throw new Error('"' + aSource + '" is not in the SourceMap.');
      }
    };
    IndexedSourceMapConsumer.prototype.generatedPositionFor = function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
      for (var i = 0; i < this._sections.length; i++) {
        var section2 = this._sections[i];
        if (section2.consumer._findSourceIndex(util.getArg(aArgs, "source")) === -1) {
          continue;
        }
        var generatedPosition = section2.consumer.generatedPositionFor(aArgs);
        if (generatedPosition) {
          var ret = {
            line: generatedPosition.line + (section2.generatedOffset.generatedLine - 1),
            column: generatedPosition.column + (section2.generatedOffset.generatedLine === generatedPosition.line ? section2.generatedOffset.generatedColumn - 1 : 0)
          };
          return ret;
        }
      }
      return {
        line: null,
        column: null
      };
    };
    IndexedSourceMapConsumer.prototype._parseMappings = function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      this.__generatedMappings = [];
      this.__originalMappings = [];
      for (var i = 0; i < this._sections.length; i++) {
        var section2 = this._sections[i];
        var sectionMappings = section2.consumer._generatedMappings;
        for (var j = 0; j < sectionMappings.length; j++) {
          var mapping = sectionMappings[j];
          var source = section2.consumer._sources.at(mapping.source);
          if (source !== null) {
            source = util.computeSourceURL(section2.consumer.sourceRoot, source, this._sourceMapURL);
          }
          this._sources.add(source);
          source = this._sources.indexOf(source);
          var name = null;
          if (mapping.name) {
            name = section2.consumer._names.at(mapping.name);
            this._names.add(name);
            name = this._names.indexOf(name);
          }
          var adjustedMapping = {
            source,
            generatedLine: mapping.generatedLine + (section2.generatedOffset.generatedLine - 1),
            generatedColumn: mapping.generatedColumn + (section2.generatedOffset.generatedLine === mapping.generatedLine ? section2.generatedOffset.generatedColumn - 1 : 0),
            originalLine: mapping.originalLine,
            originalColumn: mapping.originalColumn,
            name
          };
          this.__generatedMappings.push(adjustedMapping);
          if (typeof adjustedMapping.originalLine === "number") {
            this.__originalMappings.push(adjustedMapping);
          }
        }
      }
      quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
      quickSort(this.__originalMappings, util.compareByOriginalPositions);
    };
    exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;
  }
});

// node_modules/source-map-js/lib/source-node.js
var require_source_node = __commonJS({
  "node_modules/source-map-js/lib/source-node.js"(exports) {
    var SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
    var util = require_util();
    var REGEX_NEWLINE = /(\r?\n)/;
    var NEWLINE_CODE = 10;
    var isSourceNode = "$$$isSourceNode$$$";
    function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
      this.children = [];
      this.sourceContents = {};
      this.line = aLine == null ? null : aLine;
      this.column = aColumn == null ? null : aColumn;
      this.source = aSource == null ? null : aSource;
      this.name = aName == null ? null : aName;
      this[isSourceNode] = true;
      if (aChunks != null) this.add(aChunks);
    }
    SourceNode.fromStringWithSourceMap = function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
      var node = new SourceNode();
      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
      var remainingLinesIndex = 0;
      var shiftNextLine = function() {
        var lineContents = getNextLine();
        var newLine = getNextLine() || "";
        return lineContents + newLine;
        function getNextLine() {
          return remainingLinesIndex < remainingLines.length ? remainingLines[remainingLinesIndex++] : void 0;
        }
      };
      var lastGeneratedLine = 1, lastGeneratedColumn = 0;
      var lastMapping = null;
      aSourceMapConsumer.eachMapping(function(mapping) {
        if (lastMapping !== null) {
          if (lastGeneratedLine < mapping.generatedLine) {
            addMappingWithCode(lastMapping, shiftNextLine());
            lastGeneratedLine++;
            lastGeneratedColumn = 0;
          } else {
            var nextLine = remainingLines[remainingLinesIndex] || "";
            var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn);
            remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
            addMappingWithCode(lastMapping, code);
            lastMapping = mapping;
            return;
          }
        }
        while (lastGeneratedLine < mapping.generatedLine) {
          if (remainingLinesIndex >= remainingLines.length) {
            lastGeneratedLine = mapping.generatedLine;
            break;
          }
          node.add(shiftNextLine());
          lastGeneratedLine++;
        }
        if (lastGeneratedColumn < mapping.generatedColumn) {
          var nextLine = remainingLines[remainingLinesIndex] || "";
          node.add(nextLine.substr(0, mapping.generatedColumn));
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
        }
        lastMapping = mapping;
      }, this);
      if (remainingLinesIndex < remainingLines.length) {
        if (lastMapping) {
          addMappingWithCode(lastMapping, shiftNextLine());
        }
        node.add(remainingLines.splice(remainingLinesIndex).join(""));
      }
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aRelativePath != null) {
            sourceFile = util.join(aRelativePath, sourceFile);
          }
          node.setSourceContent(sourceFile, content);
        }
      });
      return node;
      function addMappingWithCode(mapping, code) {
        if (mapping === null || mapping.source === void 0) {
          node.add(code);
        } else {
          var source = aRelativePath ? util.join(aRelativePath, mapping.source) : mapping.source;
          node.add(new SourceNode(
            mapping.originalLine,
            mapping.originalColumn,
            source,
            code,
            mapping.name
          ));
        }
      }
    };
    SourceNode.prototype.add = function SourceNode_add(aChunk) {
      if (Array.isArray(aChunk)) {
        aChunk.forEach(function(chunk) {
          this.add(chunk);
        }, this);
      } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
        if (aChunk) {
          this.children.push(aChunk);
        }
      } else {
        throw new TypeError(
          "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
        );
      }
      return this;
    };
    SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
      if (Array.isArray(aChunk)) {
        for (var i = aChunk.length - 1; i >= 0; i--) {
          this.prepend(aChunk[i]);
        }
      } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
        this.children.unshift(aChunk);
      } else {
        throw new TypeError(
          "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
        );
      }
      return this;
    };
    SourceNode.prototype.walk = function SourceNode_walk(aFn) {
      var chunk;
      for (var i = 0, len = this.children.length; i < len; i++) {
        chunk = this.children[i];
        if (chunk[isSourceNode]) {
          chunk.walk(aFn);
        } else {
          if (chunk !== "") {
            aFn(chunk, {
              source: this.source,
              line: this.line,
              column: this.column,
              name: this.name
            });
          }
        }
      }
    };
    SourceNode.prototype.join = function SourceNode_join(aSep) {
      var newChildren;
      var i;
      var len = this.children.length;
      if (len > 0) {
        newChildren = [];
        for (i = 0; i < len - 1; i++) {
          newChildren.push(this.children[i]);
          newChildren.push(aSep);
        }
        newChildren.push(this.children[i]);
        this.children = newChildren;
      }
      return this;
    };
    SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
      var lastChild = this.children[this.children.length - 1];
      if (lastChild[isSourceNode]) {
        lastChild.replaceRight(aPattern, aReplacement);
      } else if (typeof lastChild === "string") {
        this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
      } else {
        this.children.push("".replace(aPattern, aReplacement));
      }
      return this;
    };
    SourceNode.prototype.setSourceContent = function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
    };
    SourceNode.prototype.walkSourceContents = function SourceNode_walkSourceContents(aFn) {
      for (var i = 0, len = this.children.length; i < len; i++) {
        if (this.children[i][isSourceNode]) {
          this.children[i].walkSourceContents(aFn);
        }
      }
      var sources = Object.keys(this.sourceContents);
      for (var i = 0, len = sources.length; i < len; i++) {
        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
      }
    };
    SourceNode.prototype.toString = function SourceNode_toString() {
      var str2 = "";
      this.walk(function(chunk) {
        str2 += chunk;
      });
      return str2;
    };
    SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
      var generated = {
        code: "",
        line: 1,
        column: 0
      };
      var map = new SourceMapGenerator(aArgs);
      var sourceMappingActive = false;
      var lastOriginalSource = null;
      var lastOriginalLine = null;
      var lastOriginalColumn = null;
      var lastOriginalName = null;
      this.walk(function(chunk, original) {
        generated.code += chunk;
        if (original.source !== null && original.line !== null && original.column !== null) {
          if (lastOriginalSource !== original.source || lastOriginalLine !== original.line || lastOriginalColumn !== original.column || lastOriginalName !== original.name) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
          lastOriginalSource = original.source;
          lastOriginalLine = original.line;
          lastOriginalColumn = original.column;
          lastOriginalName = original.name;
          sourceMappingActive = true;
        } else if (sourceMappingActive) {
          map.addMapping({
            generated: {
              line: generated.line,
              column: generated.column
            }
          });
          lastOriginalSource = null;
          sourceMappingActive = false;
        }
        for (var idx = 0, length = chunk.length; idx < length; idx++) {
          if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
            generated.line++;
            generated.column = 0;
            if (idx + 1 === length) {
              lastOriginalSource = null;
              sourceMappingActive = false;
            } else if (sourceMappingActive) {
              map.addMapping({
                source: original.source,
                original: {
                  line: original.line,
                  column: original.column
                },
                generated: {
                  line: generated.line,
                  column: generated.column
                },
                name: original.name
              });
            }
          } else {
            generated.column++;
          }
        }
      });
      this.walkSourceContents(function(sourceFile, sourceContent) {
        map.setSourceContent(sourceFile, sourceContent);
      });
      return { code: generated.code, map };
    };
    exports.SourceNode = SourceNode;
  }
});

// node_modules/source-map-js/source-map.js
var require_source_map = __commonJS({
  "node_modules/source-map-js/source-map.js"(exports) {
    exports.SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
    exports.SourceMapConsumer = require_source_map_consumer().SourceMapConsumer;
    exports.SourceNode = require_source_node().SourceNode;
  }
});

// node_modules/postcss/lib/previous-map.js
var require_previous_map = __commonJS({
  "node_modules/postcss/lib/previous-map.js"(exports, module) {
    "use strict";
    var { existsSync, readFileSync, realpathSync } = __require("fs");
    var { dirname, isAbsolute, join, relative, sep } = __require("path");
    var { SourceMapConsumer, SourceMapGenerator } = require_source_map();
    function realPath(path) {
      try {
        return realpathSync(path);
      } catch {
        return path;
      }
    }
    function fromBase64(str2) {
      if (Buffer) {
        return Buffer.from(str2, "base64").toString();
      } else {
        return window.atob(str2);
      }
    }
    var PreviousMap = class {
      constructor(css, opts) {
        if (opts.map === false) return;
        if (opts.unsafeMap) this.unsafeMap = true;
        this.loadAnnotation(css);
        this.inline = this.startWith(this.annotation, "data:");
        let prev = opts.map ? opts.map.prev : void 0;
        let text = this.loadMap(opts.from, prev);
        if (!this.mapFile && opts.from) {
          this.mapFile = opts.from;
        }
        if (this.mapFile) this.root = dirname(this.mapFile);
        if (text) this.text = text;
      }
      consumer() {
        if (!this.consumerCache) {
          this.consumerCache = new SourceMapConsumer(this.json || this.text);
        }
        return this.consumerCache;
      }
      decodeInline(text) {
        let baseCharsetUri = /^data:application\/json;charset=utf-?8;base64,/;
        let baseUri = /^data:application\/json;base64,/;
        let charsetUri = /^data:application\/json;charset=utf-?8,/;
        let uri = /^data:application\/json,/;
        let uriMatch = text.match(charsetUri) || text.match(uri);
        if (uriMatch) {
          return decodeURIComponent(text.substr(uriMatch[0].length));
        }
        let baseUriMatch = text.match(baseCharsetUri) || text.match(baseUri);
        if (baseUriMatch) {
          return fromBase64(text.substr(baseUriMatch[0].length));
        }
        let encoding = text.slice("data:application/json;".length);
        encoding = encoding.slice(0, encoding.indexOf(","));
        throw new Error("Unsupported source map encoding " + encoding);
      }
      getAnnotationURL(sourceMapString) {
        return sourceMapString.replace(/^\/\*\s*# sourceMappingURL=/, "").trim();
      }
      isMap(map) {
        if (typeof map !== "object") return false;
        return typeof map.mappings === "string" || typeof map._mappings === "string" || Array.isArray(map.sections);
      }
      loadAnnotation(css) {
        let comments = css.match(/\/\*\s*# sourceMappingURL=/g);
        if (!comments) return;
        let start = css.lastIndexOf(comments.pop());
        let end = css.indexOf("*/", start);
        if (start > -1 && end > -1) {
          this.annotation = this.getAnnotationURL(css.substring(start, end));
        }
      }
      loadFile(path, cssFile, trusted) {
        if (!trusted && !this.unsafeMap) {
          if (!/\.map$/i.test(path)) return void 0;
          if (!cssFile) return void 0;
          let rel = relative(realPath(dirname(cssFile)), realPath(path));
          if (rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) {
            return void 0;
          }
        }
        this.root = dirname(path);
        if (existsSync(path)) {
          this.mapFile = path;
          return readFileSync(path, "utf-8").toString().trim();
        }
      }
      loadMap(file, prev) {
        if (prev === false) return false;
        if (prev) {
          if (typeof prev === "string") {
            return prev;
          } else if (typeof prev === "function") {
            let prevPath = prev(file);
            if (prevPath) {
              let map = this.loadFile(prevPath, file, true);
              if (!map) {
                throw new Error(
                  "Unable to load previous source map: " + prevPath.toString()
                );
              }
              return map;
            }
          } else if (prev instanceof SourceMapConsumer) {
            return SourceMapGenerator.fromSourceMap(prev).toString();
          } else if (prev instanceof SourceMapGenerator) {
            return prev.toString();
          } else if (this.isMap(prev)) {
            return JSON.stringify(prev);
          } else {
            throw new Error(
              "Unsupported previous source map format: " + prev.toString()
            );
          }
        } else if (this.inline) {
          return this.decodeInline(this.annotation);
        } else if (this.annotation) {
          let map = this.annotation;
          if (file) map = join(dirname(file), map);
          let unknown = this.loadFile(map, file, false);
          if (unknown) {
            try {
              this.json = JSON.parse(unknown.replace(/^\)]}'[^\n]*\n/, ""));
            } catch {
              return void 0;
            }
          }
          return unknown;
        }
      }
      startWith(string, start) {
        if (!string) return false;
        return string.substr(0, start.length) === start;
      }
      withContent() {
        return !!(this.consumer().sourcesContent && this.consumer().sourcesContent.length > 0);
      }
    };
    module.exports = PreviousMap;
    PreviousMap.default = PreviousMap;
  }
});

// node_modules/postcss/lib/input.js
var require_input = __commonJS({
  "node_modules/postcss/lib/input.js"(exports, module) {
    "use strict";
    var { nanoid } = require_non_secure();
    var { isAbsolute, resolve } = __require("path");
    var { SourceMapConsumer, SourceMapGenerator } = require_source_map();
    var { fileURLToPath, pathToFileURL } = __require("url");
    var CssSyntaxError = require_css_syntax_error();
    var PreviousMap = require_previous_map();
    var terminalHighlight = require_terminal_highlight();
    var lineToIndexCache = /* @__PURE__ */ Symbol("lineToIndexCache");
    var sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator);
    var pathAvailable = Boolean(resolve && isAbsolute);
    function getLineToIndex(input) {
      if (input[lineToIndexCache]) return input[lineToIndexCache];
      let lines = input.css.split("\n");
      let lineToIndex = new Array(lines.length);
      let prevIndex = 0;
      for (let i = 0, l = lines.length; i < l; i++) {
        lineToIndex[i] = prevIndex;
        prevIndex += lines[i].length + 1;
      }
      input[lineToIndexCache] = lineToIndex;
      return lineToIndex;
    }
    var Input = class {
      get from() {
        return this.file || this.id;
      }
      constructor(css, opts = {}) {
        if (css === null || typeof css === "undefined" || typeof css === "object" && !css.toString) {
          throw new Error(`PostCSS received ${css} instead of CSS string`);
        }
        this.css = css.toString();
        if (this.css[0] === "\uFEFF" || this.css[0] === "\uFFFE") {
          this.hasBOM = true;
          this.css = this.css.slice(1);
        } else {
          this.hasBOM = false;
        }
        this.document = this.css;
        if (opts.document) this.document = opts.document.toString();
        if (opts.from) {
          if (!pathAvailable || /^\w+:\/\//.test(opts.from) || isAbsolute(opts.from)) {
            this.file = opts.from;
          } else {
            this.file = resolve(opts.from);
          }
        }
        if (pathAvailable && sourceMapAvailable) {
          let map = new PreviousMap(this.css, opts);
          if (map.text) {
            this.map = map;
            let file = map.consumer().file;
            if (!this.file && file) this.file = this.mapResolve(file);
          }
        }
        if (!this.file) {
          this.id = "<input css " + nanoid(6) + ">";
        }
        if (this.map) this.map.file = this.from;
      }
      error(message, line, column, opts = {}) {
        let endColumn, endLine, endOffset, offset, result;
        if (line && typeof line === "object") {
          let start = line;
          let end = column;
          if (typeof start.offset === "number") {
            offset = start.offset;
            let pos = this.fromOffset(offset);
            line = pos.line;
            column = pos.col;
          } else {
            line = start.line;
            column = start.column;
            offset = this.fromLineAndColumn(line, column);
          }
          if (typeof end.offset === "number") {
            endOffset = end.offset;
            let pos = this.fromOffset(endOffset);
            endLine = pos.line;
            endColumn = pos.col;
          } else {
            endLine = end.line;
            endColumn = end.column;
            endOffset = this.fromLineAndColumn(end.line, end.column);
          }
        } else if (!column) {
          offset = line;
          let pos = this.fromOffset(offset);
          line = pos.line;
          column = pos.col;
        } else {
          offset = this.fromLineAndColumn(line, column);
        }
        let origin = this.origin(line, column, endLine, endColumn);
        if (origin) {
          result = new CssSyntaxError(
            message,
            origin.endLine === void 0 ? origin.line : { column: origin.column, line: origin.line },
            origin.endLine === void 0 ? origin.column : { column: origin.endColumn, line: origin.endLine },
            origin.source,
            origin.file,
            opts.plugin
          );
        } else {
          result = new CssSyntaxError(
            message,
            endLine === void 0 ? line : { column, line },
            endLine === void 0 ? column : { column: endColumn, line: endLine },
            this.css,
            this.file,
            opts.plugin
          );
        }
        result.input = {
          column,
          endColumn,
          endLine,
          endOffset,
          line,
          offset,
          source: this.css
        };
        if (this.file) {
          if (pathToFileURL) {
            result.input.url = pathToFileURL(this.file).toString();
          }
          result.input.file = this.file;
        }
        return result;
      }
      fromLineAndColumn(line, column) {
        let lineToIndex = getLineToIndex(this);
        let index = lineToIndex[line - 1];
        return index + column - 1;
      }
      fromOffset(offset) {
        let lineToIndex = getLineToIndex(this);
        let lastLine = lineToIndex[lineToIndex.length - 1];
        let min = 0;
        if (offset >= lastLine) {
          min = lineToIndex.length - 1;
        } else {
          let max = lineToIndex.length - 2;
          let mid;
          while (min < max) {
            mid = min + (max - min >> 1);
            if (offset < lineToIndex[mid]) {
              max = mid - 1;
            } else if (offset >= lineToIndex[mid + 1]) {
              min = mid + 1;
            } else {
              min = mid;
              break;
            }
          }
        }
        return {
          col: offset - lineToIndex[min] + 1,
          line: min + 1
        };
      }
      mapResolve(file) {
        if (/^\w+:\/\//.test(file)) {
          return file;
        }
        return resolve(this.map.consumer().sourceRoot || this.map.root || ".", file);
      }
      origin(line, column, endLine, endColumn) {
        if (!this.map) return false;
        let consumer = this.map.consumer();
        let from = consumer.originalPositionFor({ column: column - 1, line });
        if (!from.source) return false;
        let to;
        if (typeof endLine === "number") {
          let toPosition = consumer.originalPositionFor({
            column: endColumn - 1,
            line: endLine
          });
          if (toPosition.source) to = toPosition;
        }
        let fromUrl;
        if (isAbsolute(from.source)) {
          fromUrl = pathToFileURL(from.source);
        } else {
          fromUrl = new URL(
            from.source,
            pathToFileURL(this.map.mapFile || resolve(".") + "/")
          );
        }
        let result = {
          column: from.column + 1,
          endColumn: to && to.column + 1,
          endLine: to && to.line,
          line: from.line,
          url: fromUrl.toString()
        };
        if (fromUrl.protocol === "file:") {
          if (fileURLToPath) {
            result.file = fileURLToPath(fromUrl);
          } else {
            throw new Error(`file: protocol is not available in this PostCSS build`);
          }
        }
        let source = consumer.sourceContentFor(from.source);
        if (source) result.source = source;
        return result;
      }
      toJSON() {
        let json2 = {};
        for (let name of ["hasBOM", "css", "file", "id"]) {
          if (this[name] != null) {
            json2[name] = this[name];
          }
        }
        if (this.map) {
          json2.map = { ...this.map };
          if (json2.map.consumerCache) {
            json2.map.consumerCache = void 0;
          }
        }
        return json2;
      }
    };
    module.exports = Input;
    Input.default = Input;
    if (terminalHighlight && terminalHighlight.registerInput) {
      terminalHighlight.registerInput(Input);
    }
  }
});

// node_modules/postcss/lib/root.js
var require_root = __commonJS({
  "node_modules/postcss/lib/root.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var LazyResult;
    var Processor;
    var Root2 = class extends Container {
      constructor(defaults) {
        super(defaults);
        this.type = "root";
        if (!this.nodes) this.nodes = [];
      }
      normalize(child, sample, type) {
        let keepBefore = /* @__PURE__ */ new Set();
        for (let node of Array.isArray(child) ? child : [child]) {
          if (node && typeof node === "object" && !node.parent && node.raws && typeof node.raws.before !== "undefined") {
            keepBefore.add(node.raws);
          }
        }
        let nodes = super.normalize(child);
        if (sample) {
          if (type === "prepend") {
            if (this.nodes.length > 1) {
              sample.raws.before = this.nodes[1].raws.before;
            } else {
              delete sample.raws.before;
            }
          } else if (this.first !== sample) {
            for (let node of nodes) {
              if (!keepBefore.has(node.raws)) {
                node.raws.before = sample.raws.before;
              }
            }
          }
        }
        return nodes;
      }
      removeChild(child, ignore) {
        let index = this.index(child);
        if (!ignore && index === 0 && this.nodes.length > 1) {
          this.nodes[1].raws.before = this.nodes[index].raws.before;
        }
        return super.removeChild(child);
      }
      toResult(opts = {}) {
        let lazy = new LazyResult(new Processor(), this, opts);
        return lazy.stringify();
      }
    };
    Root2.registerLazyResult = (dependant) => {
      LazyResult = dependant;
    };
    Root2.registerProcessor = (dependant) => {
      Processor = dependant;
    };
    module.exports = Root2;
    Root2.default = Root2;
    Container.registerRoot(Root2);
  }
});

// node_modules/postcss/lib/list.js
var require_list = __commonJS({
  "node_modules/postcss/lib/list.js"(exports, module) {
    "use strict";
    var list = {
      comma(string) {
        return list.split(string, [","], true);
      },
      space(string) {
        let spaces = [" ", "\n", "	"];
        return list.split(string, spaces);
      },
      split(string, separators, last) {
        if (typeof string !== "string") return [];
        let array = [];
        let current = "";
        let split = false;
        let func = 0;
        let inQuote = false;
        let prevQuote = "";
        let escape3 = false;
        let inComment = false;
        for (let i = 0; i < string.length; i++) {
          let letter = string[i];
          if (inComment) {
            current += letter;
            if (letter === "*" && string[i + 1] === "/") {
              current += "/";
              i += 1;
              inComment = false;
            }
            continue;
          }
          if (escape3) {
            escape3 = false;
          } else if (letter === "\\") {
            escape3 = true;
          } else if (inQuote) {
            if (letter === prevQuote) {
              inQuote = false;
            }
          } else if (letter === '"' || letter === "'") {
            inQuote = true;
            prevQuote = letter;
          } else if (letter === "/" && string[i + 1] === "*") {
            current += "/*";
            i += 1;
            inComment = true;
            continue;
          } else if (letter === "(") {
            func += 1;
          } else if (letter === ")") {
            if (func > 0) func -= 1;
          } else if (func === 0) {
            if (separators.includes(letter)) split = true;
          }
          if (split) {
            let value2 = current.trim();
            if (last || value2 !== "") array.push(value2);
            current = "";
            split = false;
          } else {
            current += letter;
          }
        }
        let value = current.trim();
        if (last || value !== "") array.push(value);
        return array;
      }
    };
    module.exports = list;
    list.default = list;
  }
});

// node_modules/postcss/lib/rule.js
var require_rule = __commonJS({
  "node_modules/postcss/lib/rule.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var list = require_list();
    var Rule = class extends Container {
      get selectors() {
        return list.comma(this.selector);
      }
      set selectors(values2) {
        let match = this.selector ? this.selector.match(/,\s*/) : null;
        let sep = match ? match[0] : "," + this.raw("between", "beforeOpen");
        this.selector = values2.join(sep);
      }
      constructor(defaults) {
        super(defaults);
        this.type = "rule";
        if (!this.nodes) this.nodes = [];
      }
    };
    module.exports = Rule;
    Rule.default = Rule;
    Container.registerRule(Rule);
  }
});

// node_modules/postcss/lib/fromJSON.js
var require_fromJSON = __commonJS({
  "node_modules/postcss/lib/fromJSON.js"(exports, module) {
    "use strict";
    var AtRule = require_at_rule();
    var Comment3 = require_comment();
    var Declaration = require_declaration();
    var Input = require_input();
    var PreviousMap = require_previous_map();
    var Root2 = require_root();
    var Rule = require_rule();
    function hydrateInputs(json2, inputs) {
      if (!json2.inputs) return inputs;
      return json2.inputs.map((input) => {
        let inputHydrated = { ...input, __proto__: Input.prototype };
        if (inputHydrated.map) {
          inputHydrated.map = {
            ...inputHydrated.map,
            __proto__: PreviousMap.prototype
          };
        }
        return inputHydrated;
      });
    }
    function constructNode(json2, inputs, children) {
      let defaults = { ...json2 };
      delete defaults.inputs;
      delete defaults.nodes;
      if (defaults.source) {
        let { inputId, ...source } = defaults.source;
        defaults.source = source;
        if (inputId != null) {
          defaults.source.input = inputs[inputId];
        }
      }
      let node;
      if (defaults.type === "root") {
        node = new Root2(defaults);
      } else if (defaults.type === "decl") {
        node = new Declaration(defaults);
      } else if (defaults.type === "rule") {
        node = new Rule(defaults);
      } else if (defaults.type === "comment") {
        node = new Comment3(defaults);
      } else if (defaults.type === "atrule") {
        node = new AtRule(defaults);
      } else {
        throw new Error("Unknown node type: " + json2.type);
      }
      if (children) {
        node.nodes = children;
        for (let child of children) child.parent = node;
      }
      return node;
    }
    function fromJSON(json2, inputs) {
      if (Array.isArray(json2)) return json2.map((n) => fromJSON(n));
      let result;
      let stack = [
        { childIndex: 0, children: [], inputs: hydrateInputs(json2, inputs), json: json2 }
      ];
      while (stack.length > 0) {
        let frame = stack[stack.length - 1];
        let jsonNodes = frame.json.nodes;
        if (jsonNodes && frame.childIndex < jsonNodes.length) {
          let childJson = jsonNodes[frame.childIndex];
          frame.childIndex += 1;
          stack.push({
            childIndex: 0,
            children: [],
            inputs: hydrateInputs(childJson, frame.inputs),
            json: childJson
          });
          continue;
        }
        stack.pop();
        let node = constructNode(
          frame.json,
          frame.inputs,
          jsonNodes ? frame.children : void 0
        );
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(node);
        } else {
          result = node;
        }
      }
      return result;
    }
    module.exports = fromJSON;
    fromJSON.default = fromJSON;
  }
});

// node_modules/postcss/lib/map-generator.js
var require_map_generator = __commonJS({
  "node_modules/postcss/lib/map-generator.js"(exports, module) {
    "use strict";
    var { dirname, relative, resolve, sep } = __require("path");
    var { SourceMapConsumer, SourceMapGenerator } = require_source_map();
    var { pathToFileURL } = __require("url");
    var Input = require_input();
    var sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator);
    var pathAvailable = Boolean(dirname && resolve && relative && sep);
    var MapGenerator = class {
      constructor(stringify2, root, opts, cssString) {
        this.stringify = stringify2;
        this.mapOpts = opts.map || {};
        this.root = root;
        this.opts = opts;
        this.css = cssString;
        this.originalCSS = cssString;
        this.usesFileUrls = !this.mapOpts.from && this.mapOpts.absolute;
        this.memoizedFileURLs = /* @__PURE__ */ new Map();
        this.memoizedPaths = /* @__PURE__ */ new Map();
        this.memoizedURLs = /* @__PURE__ */ new Map();
      }
      addAnnotation() {
        let content;
        if (this.isInline()) {
          content = "data:application/json;base64," + this.toBase64(this.map.toString());
        } else if (typeof this.mapOpts.annotation === "string") {
          content = this.mapOpts.annotation;
        } else if (typeof this.mapOpts.annotation === "function") {
          content = this.mapOpts.annotation(this.opts.to, this.root);
        } else {
          content = this.outputFile() + ".map";
        }
        let eol = "\n";
        if (this.css.includes("\r\n")) eol = "\r\n";
        this.css += eol + "/*# sourceMappingURL=" + content + " */";
      }
      applyPrevMaps() {
        for (let prev of this.previous()) {
          let from = this.toUrl(this.path(prev.file));
          let root = prev.root || dirname(prev.file);
          let map;
          if (this.mapOpts.sourcesContent === false) {
            map = new SourceMapConsumer(prev.text);
            if (map.sourcesContent) {
              map.sourcesContent = null;
            }
          } else {
            map = prev.consumer();
          }
          this.map.applySourceMap(map, from, this.toUrl(this.path(root)));
        }
      }
      clearAnnotation() {
        if (this.mapOpts.annotation === false) return;
        if (this.root) {
          let node;
          for (let i = this.root.nodes.length - 1; i >= 0; i--) {
            node = this.root.nodes[i];
            if (node.type !== "comment") continue;
            if (node.text.startsWith("# sourceMappingURL=")) {
              this.root.removeChild(i);
            }
          }
        } else if (this.css) {
          let annotation = "/*# sourceMappingURL=";
          let css = "";
          let cursor = 0;
          let startIndex;
          while ((startIndex = this.css.indexOf(annotation, cursor)) !== -1) {
            let endIndex = this.css.indexOf("*/", startIndex + annotation.length);
            if (endIndex === -1) break;
            if (endIndex + 2 === this.css.length || /[\t\n\f\r ]/.test(this.css[endIndex + 2])) {
              while (startIndex > cursor && (this.css[startIndex - 1] === "\n" || this.css[startIndex - 1] === "\r")) {
                startIndex--;
              }
            }
            css += this.css.slice(cursor, startIndex);
            cursor = endIndex + 2;
          }
          if (cursor > 0) this.css = css + this.css.slice(cursor);
        }
      }
      generate() {
        this.clearAnnotation();
        if (pathAvailable && sourceMapAvailable && this.isMap()) {
          return this.generateMap();
        } else {
          let result = "";
          this.stringify(this.root, (i) => {
            result += i;
          });
          return [result];
        }
      }
      generateMap() {
        if (this.root) {
          this.generateString();
        } else if (this.previous().length === 1) {
          let prev = this.previous()[0].consumer();
          prev.file = this.outputFile();
          this.map = SourceMapGenerator.fromSourceMap(prev, {
            ignoreInvalidMapping: true
          });
        } else {
          this.map = new SourceMapGenerator({
            file: this.outputFile(),
            ignoreInvalidMapping: true
          });
          this.map.addMapping({
            generated: { column: 0, line: 1 },
            original: { column: 0, line: 1 },
            source: this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>"
          });
        }
        if (this.isSourcesContent()) this.setSourcesContent();
        if (this.root && this.previous().length > 0) this.applyPrevMaps();
        if (this.isAnnotation()) this.addAnnotation();
        if (this.isInline()) {
          return [this.css];
        } else {
          return [this.css, this.map];
        }
      }
      generateString() {
        this.css = "";
        this.map = new SourceMapGenerator({
          file: this.outputFile(),
          ignoreInvalidMapping: true
        });
        let line = 1;
        let column = 1;
        let noSource = "<no source>";
        let mapping = {
          generated: { column: 0, line: 0 },
          original: { column: 0, line: 0 },
          source: ""
        };
        let last, lines;
        this.stringify(this.root, (str2, node, type) => {
          this.css += str2;
          if (node && type !== "end") {
            mapping.generated.line = line;
            mapping.generated.column = column - 1;
            if (node.source && node.source.start) {
              mapping.source = this.sourcePath(node);
              mapping.original.line = node.source.start.line;
              mapping.original.column = node.source.start.column - 1;
              this.map.addMapping(mapping);
            } else {
              mapping.source = noSource;
              mapping.original.line = 1;
              mapping.original.column = 0;
              this.map.addMapping(mapping);
            }
          }
          lines = str2.match(/\n/g);
          if (lines) {
            line += lines.length;
            last = str2.lastIndexOf("\n");
            column = str2.length - last;
          } else {
            column += str2.length;
          }
          if (node && type !== "start") {
            let p = node.parent || { raws: {} };
            let childless = node.type === "decl" || node.type === "atrule" && !node.nodes;
            if (!childless || node !== p.last || p.raws.semicolon) {
              if (node.source && node.source.end) {
                mapping.source = this.sourcePath(node);
                mapping.original.line = node.source.end.line;
                mapping.original.column = node.source.end.column - 1;
                mapping.generated.line = line;
                mapping.generated.column = column - 2;
                this.map.addMapping(mapping);
              } else {
                mapping.source = noSource;
                mapping.original.line = 1;
                mapping.original.column = 0;
                mapping.generated.line = line;
                mapping.generated.column = column - 1;
                this.map.addMapping(mapping);
              }
            }
          }
        });
      }
      isAnnotation() {
        if (this.isInline()) {
          return true;
        }
        if (typeof this.mapOpts.annotation !== "undefined") {
          return this.mapOpts.annotation;
        }
        if (this.previous().length) {
          return this.previous().some((i) => i.annotation);
        }
        return true;
      }
      isInline() {
        if (typeof this.mapOpts.inline !== "undefined") {
          return this.mapOpts.inline;
        }
        let annotation = this.mapOpts.annotation;
        if (typeof annotation !== "undefined" && annotation !== true) {
          return false;
        }
        if (this.previous().length) {
          return this.previous().some((i) => i.inline);
        }
        return true;
      }
      isMap() {
        if (typeof this.opts.map !== "undefined") {
          return !!this.opts.map;
        }
        return this.previous().length > 0;
      }
      isSourcesContent() {
        if (typeof this.mapOpts.sourcesContent !== "undefined") {
          return this.mapOpts.sourcesContent;
        }
        if (this.previous().length) {
          return this.previous().some((i) => i.withContent());
        }
        return true;
      }
      outputFile() {
        if (this.opts.to) {
          return this.path(this.opts.to);
        } else if (this.opts.from) {
          return this.path(this.opts.from);
        } else {
          return "to.css";
        }
      }
      path(file) {
        if (this.mapOpts.absolute) return file;
        if (file.charCodeAt(0) === 60) return file;
        if (/^\w+:\/\//.test(file)) return file;
        let cached = this.memoizedPaths.get(file);
        if (cached) return cached;
        let from = this.opts.to ? dirname(this.opts.to) : ".";
        if (typeof this.mapOpts.annotation === "string") {
          from = dirname(resolve(from, this.mapOpts.annotation));
        }
        let path = relative(from, file);
        this.memoizedPaths.set(file, path);
        return path;
      }
      previous() {
        if (!this.previousMaps) {
          this.previousMaps = [];
          if (this.root) {
            this.root.walk((node) => {
              if (node.source && node.source.input.map) {
                let map = node.source.input.map;
                if (!this.previousMaps.includes(map)) {
                  this.previousMaps.push(map);
                }
              }
            });
          } else {
            let input = new Input(this.originalCSS, this.opts);
            if (input.map) this.previousMaps.push(input.map);
          }
        }
        return this.previousMaps;
      }
      setSourcesContent() {
        let already = {};
        if (this.root) {
          this.root.walk((node) => {
            if (node.source) {
              let from = node.source.input.from;
              if (from && !already[from]) {
                already[from] = true;
                let fromUrl = this.usesFileUrls ? this.toFileUrl(from) : this.toUrl(this.path(from));
                this.map.setSourceContent(fromUrl, node.source.input.css);
              }
            }
          });
        } else if (this.css) {
          let from = this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>";
          this.map.setSourceContent(from, this.css);
        }
      }
      sourcePath(node) {
        if (this.mapOpts.from) {
          return this.toUrl(this.mapOpts.from);
        } else if (this.usesFileUrls) {
          return this.toFileUrl(node.source.input.from);
        } else {
          return this.toUrl(this.path(node.source.input.from));
        }
      }
      toBase64(str2) {
        if (Buffer) {
          return Buffer.from(str2).toString("base64");
        } else {
          return window.btoa(unescape(encodeURIComponent(str2)));
        }
      }
      toFileUrl(path) {
        let cached = this.memoizedFileURLs.get(path);
        if (cached) return cached;
        if (pathToFileURL) {
          let fileURL = pathToFileURL(path).toString();
          this.memoizedFileURLs.set(path, fileURL);
          return fileURL;
        } else {
          throw new Error(
            "`map.absolute` option is not available in this PostCSS build"
          );
        }
      }
      toUrl(path) {
        let cached = this.memoizedURLs.get(path);
        if (cached) return cached;
        if (sep === "\\") {
          path = path.replace(/\\/g, "/");
        }
        let url = encodeURI(path).replace(/[#?]/g, encodeURIComponent);
        this.memoizedURLs.set(path, url);
        return url;
      }
    };
    module.exports = MapGenerator;
  }
});

// node_modules/postcss/lib/parser.js
var require_parser = __commonJS({
  "node_modules/postcss/lib/parser.js"(exports, module) {
    "use strict";
    var AtRule = require_at_rule();
    var Comment3 = require_comment();
    var Declaration = require_declaration();
    var Root2 = require_root();
    var Rule = require_rule();
    var tokenizer = require_tokenize();
    var SAFE_COMMENT_NEIGHBOR = {
      empty: true,
      space: true
    };
    function findLastWithPosition(tokens) {
      for (let i = tokens.length - 1; i >= 0; i--) {
        let token = tokens[i];
        let pos = token[3] || token[2];
        if (pos) return pos;
      }
    }
    function tokensToString(tokens, from, to) {
      let result = "";
      for (let i = from; i < to; i++) result += tokens[i][1];
      return result;
    }
    var Parser2 = class {
      constructor(input) {
        this.input = input;
        this.root = new Root2();
        this.current = this.root;
        this.spaces = "";
        this.semicolon = false;
        this.createTokenizer();
        this.root.source = { input, start: { column: 1, line: 1, offset: 0 } };
      }
      atrule(token) {
        let node = new AtRule();
        node.name = token[1].slice(1);
        if (node.name === "") {
          this.unnamedAtrule(node, token);
        }
        this.init(node, token[2]);
        let type;
        let prev;
        let shift;
        let last = false;
        let open = false;
        let params = [];
        let brackets = [];
        while (!this.tokenizer.endOfFile()) {
          token = this.tokenizer.nextToken();
          type = token[0];
          if (type === "(" || type === "[") {
            brackets.push(type === "(" ? ")" : "]");
          } else if (type === "{" && brackets.length > 0) {
            brackets.push("}");
          } else if (type === brackets[brackets.length - 1]) {
            brackets.pop();
          }
          if (brackets.length === 0) {
            if (type === ";") {
              node.source.end = this.getPosition(token[2]);
              node.source.end.offset++;
              this.semicolon = true;
              break;
            } else if (type === "{") {
              open = true;
              break;
            } else if (type === "}") {
              if (params.length > 0) {
                shift = params.length - 1;
                prev = params[shift];
                while (prev && prev[0] === "space") {
                  prev = params[--shift];
                }
                if (prev) {
                  node.source.end = this.getPosition(prev[3] || prev[2]);
                  node.source.end.offset++;
                }
              }
              this.end(token);
              break;
            } else {
              params.push(token);
            }
          } else {
            params.push(token);
          }
          if (this.tokenizer.endOfFile()) {
            last = true;
            break;
          }
        }
        node.raws.between = this.spacesAndCommentsFromEnd(params);
        if (params.length) {
          node.raws.afterName = this.spacesAndCommentsFromStart(params);
          this.raw(node, "params", params);
          if (last) {
            token = params[params.length - 1];
            node.source.end = this.getPosition(token[3] || token[2]);
            node.source.end.offset++;
            this.spaces = node.raws.between;
            node.raws.between = "";
          }
        } else {
          node.raws.afterName = "";
          node.params = "";
        }
        if (open) {
          node.nodes = [];
          this.current = node;
        }
      }
      checkMissedSemicolon(tokens) {
        let colon = this.colon(tokens);
        if (colon === false) return;
        let founded = 0;
        let token;
        for (let j = colon - 1; j >= 0; j--) {
          token = tokens[j];
          if (token[0] !== "space") {
            founded += 1;
            if (founded === 2) break;
          }
        }
        throw this.input.error(
          "Missed semicolon",
          token[0] === "word" ? token[3] + 1 : token[2]
        );
      }
      colon(tokens) {
        let brackets = 0;
        let prev, token, type;
        for (let [i, element] of tokens.entries()) {
          token = element;
          type = token[0];
          if (type === "(") {
            brackets += 1;
          }
          if (type === ")") {
            brackets -= 1;
          }
          if (brackets === 0 && type === ":") {
            if (!prev) {
              this.doubleColon(token);
            } else if (prev[0] === "word" && prev[1] === "progid") {
              continue;
            } else {
              return i;
            }
          }
          prev = token;
        }
        return false;
      }
      comment(token) {
        let node = new Comment3();
        this.init(node, token[2]);
        node.source.end = this.getPosition(token[3] || token[2]);
        node.source.end.offset++;
        let text = token[1].slice(2, -2);
        if (!text.trim()) {
          node.text = "";
          node.raws.left = text;
          node.raws.right = "";
        } else {
          let match = text.match(/^(\s*)([^]*\S)(\s*)$/);
          node.text = match[2];
          node.raws.left = match[1];
          node.raws.right = match[3];
        }
      }
      createTokenizer() {
        this.tokenizer = tokenizer(this.input);
      }
      decl(tokens, customProperty) {
        let node = new Declaration();
        this.init(node, tokens[0][2]);
        let last = tokens[tokens.length - 1];
        if (last[0] === ";") {
          this.semicolon = true;
          tokens.pop();
        }
        node.source.end = this.getPosition(
          last[3] || last[2] || findLastWithPosition(tokens)
        );
        node.source.end.offset++;
        let start = 0;
        while (tokens[start][0] !== "word") {
          if (start === tokens.length - 1) this.unknownWord([tokens[start]]);
          start++;
        }
        node.raws.before += tokensToString(tokens, 0, start);
        node.source.start = this.getPosition(tokens[start][2]);
        let propStart = start;
        while (start < tokens.length) {
          let type = tokens[start][0];
          if (type === ":" || type === "space" || type === "comment") {
            break;
          }
          start++;
        }
        node.prop = tokensToString(tokens, propStart, start);
        let betweenStart = start;
        let token;
        while (start < tokens.length) {
          token = tokens[start];
          start++;
          if (token[0] === ":") break;
          if (token[0] === "word" && /\w/.test(token[1])) {
            this.unknownWord([token]);
          }
        }
        node.raws.between = tokensToString(tokens, betweenStart, start);
        if (node.prop[0] === "_" || node.prop[0] === "*") {
          node.raws.before += node.prop[0];
          node.prop = node.prop.slice(1);
        }
        let firstSpacesStart = start;
        while (start < tokens.length) {
          let next = tokens[start][0];
          if (next !== "space" && next !== "comment") break;
          start++;
        }
        let firstSpaces = tokens.slice(firstSpacesStart, start);
        tokens = tokens.slice(start);
        this.precheckMissedSemicolon(tokens);
        for (let i = tokens.length - 1; i >= 0; i--) {
          token = tokens[i];
          if (token[1].toLowerCase() === "!important") {
            node.important = true;
            let string = this.stringFrom(tokens, i);
            string = this.spacesFromEnd(tokens) + string;
            if (string !== " !important") node.raws.important = string;
            break;
          } else if (token[1].toLowerCase() === "important") {
            let cache = tokens.slice(0);
            let str2 = "";
            for (let j = i; j > 0; j--) {
              let type = cache[j][0];
              if (str2.trim().startsWith("!") && type !== "space") {
                break;
              }
              str2 = cache.pop()[1] + str2;
            }
            if (str2.trim().startsWith("!")) {
              node.important = true;
              node.raws.important = str2;
              tokens = cache;
            }
          }
          if (token[0] !== "space" && token[0] !== "comment") {
            break;
          }
        }
        let hasWord = tokens.some((i) => i[0] !== "space" && i[0] !== "comment");
        if (hasWord) {
          node.raws.between += firstSpaces.map((i) => i[1]).join("");
          firstSpaces = [];
        }
        this.raw(node, "value", firstSpaces.concat(tokens), customProperty);
        if (node.value.includes(":") && !customProperty) {
          this.checkMissedSemicolon(tokens);
        }
      }
      doubleColon(token) {
        throw this.input.error(
          "Double colon",
          { offset: token[2] },
          { offset: token[2] + token[1].length }
        );
      }
      emptyRule(token) {
        let node = new Rule();
        this.init(node, token[2]);
        node.selector = "";
        node.raws.between = "";
        this.current = node;
      }
      end(token) {
        if (this.current.nodes && this.current.nodes.length) {
          this.current.raws.semicolon = this.semicolon;
        }
        this.semicolon = false;
        this.current.raws.after = (this.current.raws.after || "") + this.spaces;
        this.spaces = "";
        if (this.current.parent) {
          this.current.source.end = this.getPosition(token[2]);
          this.current.source.end.offset++;
          this.current = this.current.parent;
        } else {
          this.unexpectedClose(token);
        }
      }
      endFile() {
        if (this.current.parent) this.unclosedBlock();
        if (this.current.nodes && this.current.nodes.length) {
          this.current.raws.semicolon = this.semicolon;
        }
        this.current.raws.after = (this.current.raws.after || "") + this.spaces;
        this.root.source.end = this.getPosition(this.tokenizer.position());
      }
      freeSemicolon(token) {
        this.spaces += token[1];
        if (this.current.nodes) {
          let prev = this.current.nodes[this.current.nodes.length - 1];
          if (prev && prev.type === "rule" && !prev.raws.ownSemicolon) {
            prev.raws.ownSemicolon = this.spaces;
            this.spaces = "";
            prev.source.end = this.getPosition(token[2]);
            prev.source.end.offset++;
          }
        }
      }
      // Helpers
      getPosition(offset) {
        let pos = this.input.fromOffset(offset);
        return {
          column: pos.col,
          line: pos.line,
          offset
        };
      }
      init(node, offset) {
        this.current.push(node);
        node.source = {
          input: this.input,
          start: this.getPosition(offset)
        };
        node.raws.before = this.spaces;
        this.spaces = "";
        if (node.type !== "comment") this.semicolon = false;
      }
      other(start) {
        let end = false;
        let type = null;
        let colon = false;
        let bracket = null;
        let brackets = [];
        let customProperty = start[1].startsWith("--");
        let tokens = [];
        let token = start;
        while (token) {
          type = token[0];
          tokens.push(token);
          if (type === "(" || type === "[") {
            if (!bracket) bracket = token;
            brackets.push(type === "(" ? ")" : "]");
          } else if (customProperty && colon && type === "{") {
            if (!bracket) bracket = token;
            brackets.push("}");
          } else if (brackets.length === 0) {
            if (type === ";") {
              if (colon) {
                this.decl(tokens, customProperty);
                return;
              } else {
                break;
              }
            } else if (type === "{") {
              this.rule(tokens);
              return;
            } else if (type === "}") {
              this.tokenizer.back(tokens.pop());
              end = true;
              break;
            } else if (type === ":") {
              colon = true;
            }
          } else if (type === brackets[brackets.length - 1]) {
            brackets.pop();
            if (brackets.length === 0) bracket = null;
          }
          token = this.tokenizer.nextToken();
        }
        if (this.tokenizer.endOfFile()) end = true;
        if (brackets.length > 0) this.unclosedBracket(bracket);
        if (end && colon) {
          if (!customProperty) {
            while (tokens.length) {
              token = tokens[tokens.length - 1][0];
              if (token !== "space" && token !== "comment") break;
              this.tokenizer.back(tokens.pop());
            }
          }
          this.decl(tokens, customProperty);
        } else {
          this.unknownWord(tokens);
        }
      }
      parse() {
        let token;
        while (!this.tokenizer.endOfFile()) {
          token = this.tokenizer.nextToken();
          switch (token[0]) {
            case "space":
              this.spaces += token[1];
              break;
            case ";":
              this.freeSemicolon(token);
              break;
            case "}":
              this.end(token);
              break;
            case "comment":
              this.comment(token);
              break;
            case "at-word":
              this.atrule(token);
              break;
            case "{":
              this.emptyRule(token);
              break;
            default:
              this.other(token);
              break;
          }
        }
        this.endFile();
      }
      precheckMissedSemicolon() {
      }
      raw(node, prop, tokens, customProperty) {
        let token, type;
        let length = tokens.length;
        let value = "";
        let last = "";
        let clean = true;
        let next, prev;
        for (let i = 0; i < length; i += 1) {
          token = tokens[i];
          type = token[0];
          if (type === "space" && i === length - 1 && !customProperty) {
            clean = false;
          } else if (type === "comment") {
            prev = tokens[i - 1] ? tokens[i - 1][0] : "empty";
            next = tokens[i + 1] ? tokens[i + 1][0] : "empty";
            if (!SAFE_COMMENT_NEIGHBOR[prev] && !SAFE_COMMENT_NEIGHBOR[next]) {
              if (last === ",") {
                clean = false;
              } else {
                value += token[1];
                last = token[1].slice(-1);
              }
            } else {
              clean = false;
            }
          } else {
            value += token[1];
            last = token[1].slice(-1);
          }
        }
        if (!clean) {
          let raw = tokens.reduce((all, i) => all + i[1], "");
          node.raws[prop] = { raw, value };
        }
        node[prop] = value;
      }
      rule(tokens) {
        tokens.pop();
        let node = new Rule();
        this.init(node, tokens[0][2]);
        node.raws.between = this.spacesAndCommentsFromEnd(tokens);
        this.raw(node, "selector", tokens);
        this.current = node;
      }
      spacesAndCommentsFromEnd(tokens) {
        let lastTokenType;
        let spaces = "";
        while (tokens.length) {
          lastTokenType = tokens[tokens.length - 1][0];
          if (lastTokenType !== "space" && lastTokenType !== "comment") break;
          spaces = tokens.pop()[1] + spaces;
        }
        return spaces;
      }
      // Errors
      spacesAndCommentsFromStart(tokens) {
        let next;
        let spaces = "";
        while (tokens.length) {
          next = tokens[0][0];
          if (next !== "space" && next !== "comment") break;
          spaces += tokens.shift()[1];
        }
        return spaces;
      }
      spacesFromEnd(tokens) {
        let lastTokenType;
        let spaces = "";
        while (tokens.length) {
          lastTokenType = tokens[tokens.length - 1][0];
          if (lastTokenType !== "space") break;
          spaces = tokens.pop()[1] + spaces;
        }
        return spaces;
      }
      stringFrom(tokens, from) {
        let result = "";
        for (let i = from; i < tokens.length; i++) {
          result += tokens[i][1];
        }
        tokens.splice(from, tokens.length - from);
        return result;
      }
      unclosedBlock() {
        let pos = this.current.source.start;
        throw this.input.error("Unclosed block", pos.line, pos.column);
      }
      unclosedBracket(bracket) {
        throw this.input.error(
          "Unclosed bracket",
          { offset: bracket[2] },
          { offset: bracket[2] + 1 }
        );
      }
      unexpectedClose(token) {
        throw this.input.error(
          "Unexpected }",
          { offset: token[2] },
          { offset: token[2] + 1 }
        );
      }
      unknownWord(tokens) {
        throw this.input.error(
          "Unknown word " + tokens[0][1],
          { offset: tokens[0][2] },
          { offset: tokens[0][2] + tokens[0][1].length }
        );
      }
      unnamedAtrule(node, token) {
        throw this.input.error(
          "At-rule without name",
          { offset: token[2] },
          { offset: token[2] + token[1].length }
        );
      }
    };
    module.exports = Parser2;
  }
});

// node_modules/postcss/lib/parse.js
var require_parse = __commonJS({
  "node_modules/postcss/lib/parse.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var Input = require_input();
    var Parser2 = require_parser();
    function parse2(css, opts) {
      let input = new Input(css, opts);
      let parser = new Parser2(input);
      try {
        parser.parse();
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          if (e.name === "CssSyntaxError" && opts && opts.from) {
            if (/\.scss$/i.test(opts.from)) {
              e.message += "\nYou tried to parse SCSS with the standard CSS parser; try again with the postcss-scss parser";
            } else if (/\.sass/i.test(opts.from)) {
              e.message += "\nYou tried to parse Sass with the standard CSS parser; try again with the postcss-sass parser";
            } else if (/\.less$/i.test(opts.from)) {
              e.message += "\nYou tried to parse Less with the standard CSS parser; try again with the postcss-less parser";
            }
          }
        }
        throw e;
      }
      return parser.root;
    }
    module.exports = parse2;
    parse2.default = parse2;
    Container.registerParse(parse2);
  }
});

// node_modules/postcss/lib/warning.js
var require_warning = __commonJS({
  "node_modules/postcss/lib/warning.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var { my } = require_symbols();
    var Warning = class {
      constructor(text, opts = {}) {
        this.type = "warning";
        this.text = text;
        if (opts.node && opts.node.source) {
          if (!opts.node[my]) {
            Container.rebuild(opts.node);
          }
          let range = opts.node.rangeBy(opts);
          this.line = range.start.line;
          this.column = range.start.column;
          this.endLine = range.end.line;
          this.endColumn = range.end.column;
        }
        for (let opt in opts) this[opt] = opts[opt];
      }
      toString() {
        if (this.node) {
          return this.node.error(this.text, {
            index: this.index,
            plugin: this.plugin,
            start: this.start,
            word: this.word
          }).message;
        }
        if (this.plugin) {
          return this.plugin + ": " + this.text;
        }
        return this.text;
      }
    };
    module.exports = Warning;
    Warning.default = Warning;
  }
});

// node_modules/postcss/lib/result.js
var require_result = __commonJS({
  "node_modules/postcss/lib/result.js"(exports, module) {
    "use strict";
    var Warning = require_warning();
    var Result2 = class {
      get content() {
        return this.css;
      }
      constructor(processor, root, opts) {
        this.processor = processor;
        this.messages = [];
        this.root = root;
        this.opts = opts;
        this.css = "";
        this.map = void 0;
      }
      toString() {
        return this.css;
      }
      warn(text, opts = {}) {
        if (!opts.plugin) {
          if (this.lastPlugin && this.lastPlugin.postcssPlugin) {
            opts.plugin = this.lastPlugin.postcssPlugin;
          }
        }
        let warning = new Warning(text, opts);
        this.messages.push(warning);
        return warning;
      }
      warnings() {
        return this.messages.filter((i) => i.type === "warning");
      }
    };
    module.exports = Result2;
    Result2.default = Result2;
  }
});

// node_modules/postcss/lib/warn-once.js
var require_warn_once = __commonJS({
  "node_modules/postcss/lib/warn-once.js"(exports, module) {
    "use strict";
    var printed = {};
    module.exports = function warnOnce(message) {
      if (printed[message]) return;
      printed[message] = true;
      if (typeof console !== "undefined" && console.warn) {
        console.warn(message);
      }
    };
  }
});

// node_modules/postcss/lib/lazy-result.js
var require_lazy_result = __commonJS({
  "node_modules/postcss/lib/lazy-result.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var Document2 = require_document();
    var MapGenerator = require_map_generator();
    var parse2 = require_parse();
    var Result2 = require_result();
    var Root2 = require_root();
    var stringify2 = require_stringify();
    var { isClean, my } = require_symbols();
    var warnOnce = require_warn_once();
    var TYPE_TO_CLASS_NAME = {
      atrule: "AtRule",
      comment: "Comment",
      decl: "Declaration",
      document: "Document",
      root: "Root",
      rule: "Rule"
    };
    var PLUGIN_PROPS = {
      AtRule: true,
      AtRuleExit: true,
      Comment: true,
      CommentExit: true,
      Declaration: true,
      DeclarationExit: true,
      Document: true,
      DocumentExit: true,
      Once: true,
      OnceExit: true,
      postcssPlugin: true,
      prepare: true,
      Root: true,
      RootExit: true,
      Rule: true,
      RuleExit: true
    };
    var NOT_VISITORS = {
      Once: true,
      postcssPlugin: true,
      prepare: true
    };
    var CHILDREN = 0;
    function isPromise(obj) {
      return typeof obj === "object" && typeof obj.then === "function";
    }
    function getEvents(node) {
      let key = false;
      let type = TYPE_TO_CLASS_NAME[node.type];
      if (node.type === "decl") {
        key = node.prop.toLowerCase();
      } else if (node.type === "atrule") {
        key = node.name.toLowerCase();
      }
      if (key && node.append) {
        return [
          type,
          type + "-" + key,
          CHILDREN,
          type + "Exit",
          type + "Exit-" + key
        ];
      } else if (key) {
        return [type, type + "-" + key, type + "Exit", type + "Exit-" + key];
      } else if (node.append) {
        return [type, CHILDREN, type + "Exit"];
      } else {
        return [type, type + "Exit"];
      }
    }
    function toStack(node) {
      let events;
      if (node.type === "document") {
        events = ["Document", CHILDREN, "DocumentExit"];
      } else if (node.type === "root") {
        events = ["Root", CHILDREN, "RootExit"];
      } else {
        events = getEvents(node);
      }
      return {
        eventIndex: 0,
        events,
        iterator: 0,
        node,
        visitorIndex: 0,
        visitors: []
      };
    }
    function cleanMarks(node) {
      let stack = [node];
      while (stack.length > 0) {
        let next = stack.pop();
        next[isClean] = false;
        if (next.nodes) {
          for (let i of next.nodes) stack.push(i);
        }
      }
      return node;
    }
    var postcss = {};
    var LazyResult = class _LazyResult {
      get content() {
        return this.stringify().content;
      }
      get css() {
        return this.stringify().css;
      }
      get map() {
        return this.stringify().map;
      }
      get messages() {
        return this.sync().messages;
      }
      get opts() {
        return this.result.opts;
      }
      get processor() {
        return this.result.processor;
      }
      get root() {
        return this.sync().root;
      }
      get [Symbol.toStringTag]() {
        return "LazyResult";
      }
      constructor(processor, css, opts) {
        this.stringified = false;
        this.processed = false;
        let root;
        if (typeof css === "object" && css !== null && (css.type === "root" || css.type === "document")) {
          root = cleanMarks(css);
        } else if (css instanceof _LazyResult || css instanceof Result2) {
          root = cleanMarks(css.root);
          if (css.map) {
            if (typeof opts.map === "undefined") opts.map = {};
            if (!opts.map.inline) opts.map.inline = false;
            opts.map.prev = css.map;
          }
        } else {
          let parser = parse2;
          if (opts.syntax) parser = opts.syntax.parse;
          if (opts.parser) parser = opts.parser;
          if (parser.parse) parser = parser.parse;
          try {
            root = parser(css, opts);
          } catch (error) {
            this.processed = true;
            this.error = error;
          }
          if (root && !root[my]) {
            Container.rebuild(root);
          }
        }
        this.result = new Result2(processor, root, opts);
        this.helpers = { ...postcss, postcss, result: this.result };
        this.plugins = this.processor.plugins.map((plugin) => {
          if (typeof plugin === "object" && plugin.prepare) {
            return { ...plugin, ...plugin.prepare(this.result) };
          } else {
            return plugin;
          }
        });
      }
      async() {
        if (this.error) return Promise.reject(this.error);
        if (this.processed) return Promise.resolve(this.result);
        if (!this.processing) {
          this.processing = this.runAsync();
        }
        return this.processing;
      }
      catch(onRejected) {
        return this.async().catch(onRejected);
      }
      finally(onFinally) {
        return this.async().finally(onFinally);
      }
      getAsyncError() {
        throw new Error("Use process(css).then(cb) to work with async plugins");
      }
      handleError(error, node) {
        let plugin = this.result.lastPlugin;
        try {
          if (node) node.addToError(error);
          this.error = error;
          if (error.name === "CssSyntaxError" && !error.plugin) {
            error.plugin = plugin.postcssPlugin;
            error.setMessage();
          } else if (plugin.postcssVersion) {
            if (process.env.NODE_ENV !== "production") {
              let pluginName = plugin.postcssPlugin;
              let pluginVer = plugin.postcssVersion;
              let runtimeVer = this.result.processor.version;
              let a = pluginVer.split(".");
              let b2 = runtimeVer.split(".");
              if (a[0] !== b2[0] || parseInt(a[1]) > parseInt(b2[1])) {
                console.error(
                  "Unknown error from PostCSS plugin. Your current PostCSS version is " + runtimeVer + ", but " + pluginName + " uses " + pluginVer + ". Perhaps this is the source of the error below."
                );
              }
            }
          }
        } catch (err) {
          if (console && console.error) console.error(err);
        }
        return error;
      }
      prepareVisitors() {
        this.listeners = {};
        let add = (plugin, type, cb) => {
          if (!this.listeners[type]) this.listeners[type] = [];
          this.listeners[type].push([plugin, cb]);
        };
        for (let plugin of this.plugins) {
          if (typeof plugin === "object") {
            for (let event in plugin) {
              if (!PLUGIN_PROPS[event] && /^[A-Z]/.test(event)) {
                throw new Error(
                  `Unknown event ${event} in ${plugin.postcssPlugin}. Try to update PostCSS (${this.processor.version} now).`
                );
              }
              if (!NOT_VISITORS[event]) {
                if (typeof plugin[event] === "object") {
                  for (let filter2 in plugin[event]) {
                    if (filter2 === "*") {
                      add(plugin, event, plugin[event][filter2]);
                    } else {
                      add(
                        plugin,
                        event + "-" + filter2.toLowerCase(),
                        plugin[event][filter2]
                      );
                    }
                  }
                } else if (typeof plugin[event] === "function") {
                  add(plugin, event, plugin[event]);
                }
              }
            }
          }
        }
        this.hasListener = Object.keys(this.listeners).length > 0;
      }
      async runAsync() {
        this.plugin = 0;
        for (let i = 0; i < this.plugins.length; i++) {
          let plugin = this.plugins[i];
          let promise = this.runOnRoot(plugin);
          if (isPromise(promise)) {
            try {
              await promise;
            } catch (error) {
              throw this.handleError(error);
            }
          }
        }
        this.prepareVisitors();
        if (this.hasListener) {
          let root = this.result.root;
          while (!root[isClean]) {
            root[isClean] = true;
            let stack = [toStack(root)];
            while (stack.length > 0) {
              let promise = this.visitTick(stack);
              if (isPromise(promise)) {
                try {
                  await promise;
                } catch (e) {
                  let node = stack[stack.length - 1].node;
                  throw this.handleError(e, node);
                }
              }
            }
          }
          if (this.listeners.OnceExit) {
            for (let [plugin, visitor] of this.listeners.OnceExit) {
              this.result.lastPlugin = plugin;
              try {
                if (root.type === "document") {
                  let roots = root.nodes.map(
                    (subRoot) => visitor(subRoot, this.helpers)
                  );
                  await Promise.all(roots);
                } else {
                  await visitor(root, this.helpers);
                }
              } catch (e) {
                throw this.handleError(e);
              }
            }
          }
        }
        this.processed = true;
        return this.stringify();
      }
      runOnRoot(plugin) {
        this.result.lastPlugin = plugin;
        try {
          if (typeof plugin === "object" && plugin.Once) {
            if (this.result.root.type === "document") {
              let roots = this.result.root.nodes.map(
                (root) => plugin.Once(root, this.helpers)
              );
              if (isPromise(roots[0])) {
                return Promise.all(roots);
              }
              return roots;
            }
            return plugin.Once(this.result.root, this.helpers);
          } else if (typeof plugin === "function") {
            return plugin(this.result.root, this.result);
          }
        } catch (error) {
          throw this.handleError(error);
        }
      }
      stringify() {
        if (this.error) throw this.error;
        if (this.stringified) return this.result;
        this.stringified = true;
        this.sync();
        let opts = this.result.opts;
        let str2 = stringify2;
        if (opts.syntax) str2 = opts.syntax.stringify;
        if (opts.stringifier) str2 = opts.stringifier;
        if (str2.stringify) str2 = str2.stringify;
        let rootSource = this.result.root.source;
        if (opts.map === void 0 && !(rootSource && rootSource.input && rootSource.input.map)) {
          let result = "";
          str2(this.result.root, (i) => {
            result += i;
          });
          this.result.css = result;
          return this.result;
        }
        let map = new MapGenerator(str2, this.result.root, this.result.opts);
        let data = map.generate();
        this.result.css = data[0];
        this.result.map = data[1];
        return this.result;
      }
      sync() {
        if (this.error) throw this.error;
        if (this.processed) return this.result;
        this.processed = true;
        if (this.processing) {
          throw this.getAsyncError();
        }
        for (let plugin of this.plugins) {
          let promise = this.runOnRoot(plugin);
          if (isPromise(promise)) {
            throw this.getAsyncError();
          }
        }
        this.prepareVisitors();
        if (this.hasListener) {
          let root = this.result.root;
          while (!root[isClean]) {
            root[isClean] = true;
            this.walkSync(root);
          }
          if (this.listeners.OnceExit) {
            if (root.type === "document") {
              for (let subRoot of root.nodes) {
                this.visitSync(this.listeners.OnceExit, subRoot);
              }
            } else {
              this.visitSync(this.listeners.OnceExit, root);
            }
          }
        }
        return this.result;
      }
      then(onFulfilled, onRejected) {
        if (process.env.NODE_ENV !== "production") {
          if (!("from" in this.opts)) {
            warnOnce(
              "Without `from` option PostCSS could generate wrong source map and will not find Browserslist config. Set it to CSS file path or to `undefined` to prevent this warning."
            );
          }
        }
        return this.async().then(onFulfilled, onRejected);
      }
      toString() {
        return this.css;
      }
      visitSync(visitors, node) {
        for (let [plugin, visitor] of visitors) {
          this.result.lastPlugin = plugin;
          let promise;
          try {
            promise = visitor(node, this.helpers);
          } catch (e) {
            throw this.handleError(e, node.proxyOf);
          }
          if (node.type !== "root" && node.type !== "document" && !node.parent) {
            return true;
          }
          if (isPromise(promise)) {
            throw this.getAsyncError();
          }
        }
      }
      visitTick(stack) {
        let visit = stack[stack.length - 1];
        let { node, visitors } = visit;
        if (node.type !== "root" && node.type !== "document" && !node.parent) {
          stack.pop();
          return;
        }
        if (visitors.length > 0 && visit.visitorIndex < visitors.length) {
          let [plugin, visitor] = visitors[visit.visitorIndex];
          visit.visitorIndex += 1;
          if (visit.visitorIndex === visitors.length) {
            visit.visitors = [];
            visit.visitorIndex = 0;
          }
          this.result.lastPlugin = plugin;
          try {
            return visitor(node.toProxy(), this.helpers);
          } catch (e) {
            throw this.handleError(e, node);
          }
        }
        if (visit.iterator !== 0) {
          let iterator = visit.iterator;
          if (visit.descending) {
            visit.descending = false;
            node.indexes[iterator] += 1;
          }
          let child;
          while (child = node.nodes[node.indexes[iterator]]) {
            if (!child[isClean]) {
              child[isClean] = true;
              visit.descending = true;
              stack.push(toStack(child));
              return;
            }
            node.indexes[iterator] += 1;
          }
          visit.iterator = 0;
          delete node.indexes[iterator];
        }
        let events = visit.events;
        while (visit.eventIndex < events.length) {
          let event = events[visit.eventIndex];
          visit.eventIndex += 1;
          if (event === CHILDREN) {
            if (node.nodes && node.nodes.length) {
              node[isClean] = true;
              visit.iterator = node.getIterator();
            }
            return;
          } else if (this.listeners[event]) {
            visit.visitors = this.listeners[event];
            return;
          }
        }
        stack.pop();
      }
      walkSync(node) {
        node[isClean] = true;
        let stack = [{ eventIndex: 0, events: getEvents(node), iterator: 0, node }];
        while (stack.length > 0) {
          let visit = stack[stack.length - 1];
          let visitNode = visit.node;
          if (visit.iterator !== 0) {
            let iterator = visit.iterator;
            if (visit.descending) {
              visit.descending = false;
              visitNode.indexes[iterator] += 1;
            }
            let child;
            let descended = false;
            while (child = visitNode.nodes[visitNode.indexes[iterator]]) {
              if (!child[isClean]) {
                child[isClean] = true;
                visit.descending = true;
                stack.push({
                  eventIndex: 0,
                  events: getEvents(child),
                  iterator: 0,
                  node: child
                });
                descended = true;
                break;
              }
              visitNode.indexes[iterator] += 1;
            }
            if (descended) continue;
            visit.iterator = 0;
            delete visitNode.indexes[iterator];
          }
          if (visit.eventIndex < visit.events.length) {
            let event = visit.events[visit.eventIndex];
            visit.eventIndex += 1;
            if (event === CHILDREN) {
              if (visitNode.nodes && visitNode.nodes.length) {
                visit.iterator = visitNode.getIterator();
              }
            } else {
              let visitors = this.listeners[event];
              if (visitors) {
                if (this.visitSync(visitors, visitNode.toProxy())) stack.pop();
              }
            }
            continue;
          }
          stack.pop();
        }
      }
      warnings() {
        return this.sync().warnings();
      }
    };
    LazyResult.registerPostcss = (dependant) => {
      postcss = dependant;
    };
    module.exports = LazyResult;
    LazyResult.default = LazyResult;
    Root2.registerLazyResult(LazyResult);
    Document2.registerLazyResult(LazyResult);
  }
});

// node_modules/postcss/lib/no-work-result.js
var require_no_work_result = __commonJS({
  "node_modules/postcss/lib/no-work-result.js"(exports, module) {
    "use strict";
    var MapGenerator = require_map_generator();
    var parse2 = require_parse();
    var Result2 = require_result();
    var stringify2 = require_stringify();
    var warnOnce = require_warn_once();
    var NoWorkResult = class {
      get content() {
        return this.result.css;
      }
      get css() {
        return this.result.css;
      }
      get map() {
        return this.result.map;
      }
      get messages() {
        return [];
      }
      get opts() {
        return this.result.opts;
      }
      get processor() {
        return this.result.processor;
      }
      get root() {
        if (this._root) {
          return this._root;
        }
        let root;
        let parser = parse2;
        try {
          root = parser(this._css, this._opts);
        } catch (error) {
          this.error = error;
        }
        if (this.error) {
          throw this.error;
        } else {
          this._root = root;
          return root;
        }
      }
      get [Symbol.toStringTag]() {
        return "NoWorkResult";
      }
      constructor(processor, css, opts) {
        css = css.toString();
        this.stringified = false;
        this._processor = processor;
        this._css = css;
        this._opts = opts;
        this._map = void 0;
        let str2 = stringify2;
        this.result = new Result2(this._processor, void 0, this._opts);
        this.result.css = css;
        let self2 = this;
        Object.defineProperty(this.result, "root", {
          get() {
            return self2.root;
          }
        });
        let map = new MapGenerator(str2, void 0, this._opts, css);
        if (map.isMap()) {
          let [generatedCSS, generatedMap] = map.generate();
          if (generatedCSS) {
            this.result.css = generatedCSS;
          }
          if (generatedMap) {
            this.result.map = generatedMap;
          }
        } else {
          map.clearAnnotation();
          this.result.css = map.css;
        }
      }
      async() {
        if (this.error) return Promise.reject(this.error);
        return Promise.resolve(this.result);
      }
      catch(onRejected) {
        return this.async().catch(onRejected);
      }
      finally(onFinally) {
        return this.async().finally(onFinally);
      }
      sync() {
        if (this.error) throw this.error;
        return this.result;
      }
      then(onFulfilled, onRejected) {
        if (process.env.NODE_ENV !== "production") {
          if (!("from" in this._opts)) {
            warnOnce(
              "Without `from` option PostCSS could generate wrong source map and will not find Browserslist config. Set it to CSS file path or to `undefined` to prevent this warning."
            );
          }
        }
        return this.async().then(onFulfilled, onRejected);
      }
      toString() {
        return this._css;
      }
      warnings() {
        return [];
      }
    };
    module.exports = NoWorkResult;
    NoWorkResult.default = NoWorkResult;
  }
});

// node_modules/postcss/lib/processor.js
var require_processor = __commonJS({
  "node_modules/postcss/lib/processor.js"(exports, module) {
    "use strict";
    var Document2 = require_document();
    var LazyResult = require_lazy_result();
    var NoWorkResult = require_no_work_result();
    var Root2 = require_root();
    var Processor = class {
      constructor(plugins = []) {
        this.version = "8.5.33";
        this.plugins = this.normalize(plugins);
      }
      normalize(plugins) {
        let normalized = [];
        for (let i of plugins) {
          if (i.postcss === true) {
            i = i();
          } else if (i.postcss) {
            i = i.postcss;
          }
          if (typeof i === "object" && Array.isArray(i.plugins)) {
            normalized = normalized.concat(i.plugins);
          } else if (typeof i === "object" && i.postcssPlugin) {
            normalized.push(i);
          } else if (typeof i === "function") {
            normalized.push(i);
          } else if (typeof i === "object" && (i.parse || i.stringify)) {
            if (process.env.NODE_ENV !== "production") {
              throw new Error(
                "PostCSS syntaxes cannot be used as plugins. Instead, please use one of the syntax/parser/stringifier options as outlined in your PostCSS runner documentation."
              );
            }
          } else {
            throw new Error(i + " is not a PostCSS plugin");
          }
        }
        return normalized;
      }
      process(css, opts = {}) {
        if (!this.plugins.length && !opts.parser && !opts.stringifier && !opts.syntax) {
          return new NoWorkResult(this, css, opts);
        } else {
          return new LazyResult(this, css, opts);
        }
      }
      use(plugin) {
        this.plugins = this.plugins.concat(this.normalize([plugin]));
        return this;
      }
    };
    module.exports = Processor;
    Processor.default = Processor;
    Root2.registerProcessor(Processor);
    Document2.registerProcessor(Processor);
  }
});

// node_modules/postcss/lib/postcss.js
var require_postcss = __commonJS({
  "node_modules/postcss/lib/postcss.js"(exports, module) {
    "use strict";
    var AtRule = require_at_rule();
    var Comment3 = require_comment();
    var Container = require_container();
    var CssSyntaxError = require_css_syntax_error();
    var Declaration = require_declaration();
    var Document2 = require_document();
    var fromJSON = require_fromJSON();
    var Input = require_input();
    var LazyResult = require_lazy_result();
    var list = require_list();
    var Node2 = require_node();
    var parse2 = require_parse();
    var Processor = require_processor();
    var Result2 = require_result();
    var Root2 = require_root();
    var Rule = require_rule();
    var stringify2 = require_stringify();
    var Warning = require_warning();
    function postcss(...plugins) {
      if (plugins.length === 1 && Array.isArray(plugins[0])) {
        plugins = plugins[0];
      }
      return new Processor(plugins);
    }
    postcss.plugin = function plugin(name, initializer) {
      let warningPrinted = false;
      function creator(...args) {
        if (console && console.warn && !warningPrinted) {
          warningPrinted = true;
          console.warn(
            name + ": postcss.plugin was deprecated. Migration guide:\nhttps://evilmartians.com/chronicles/postcss-8-plugin-migration"
          );
          if (process.env.LANG && process.env.LANG.startsWith("zh")) {
            console.warn(
              name + ": \u91CC\u9762 postcss.plugin \u88AB\u5F03\u7528. \u8FC1\u79FB\u6307\u5357:\nhttps://www.w3ctech.com/topic/2226"
            );
          }
        }
        let transformer = initializer(...args);
        transformer.postcssPlugin = name;
        transformer.postcssVersion = new Processor().version;
        return transformer;
      }
      let cache;
      Object.defineProperty(creator, "postcss", {
        get() {
          if (!cache) cache = creator();
          return cache;
        }
      });
      creator.process = function(css, processOpts, pluginOpts) {
        return postcss([creator(pluginOpts)]).process(css, processOpts);
      };
      return creator;
    };
    postcss.stringify = stringify2;
    postcss.parse = parse2;
    postcss.fromJSON = fromJSON;
    postcss.list = list;
    postcss.comment = (defaults) => new Comment3(defaults);
    postcss.atRule = (defaults) => new AtRule(defaults);
    postcss.decl = (defaults) => new Declaration(defaults);
    postcss.rule = (defaults) => new Rule(defaults);
    postcss.root = (defaults) => new Root2(defaults);
    postcss.document = (defaults) => new Document2(defaults);
    postcss.CssSyntaxError = CssSyntaxError;
    postcss.Declaration = Declaration;
    postcss.Container = Container;
    postcss.Processor = Processor;
    postcss.Document = Document2;
    postcss.Comment = Comment3;
    postcss.Warning = Warning;
    postcss.AtRule = AtRule;
    postcss.Result = Result2;
    postcss.Input = Input;
    postcss.Rule = Rule;
    postcss.Root = Root2;
    postcss.Node = Node2;
    LazyResult.registerPostcss(postcss);
    module.exports = postcss;
    postcss.default = postcss;
  }
});

// node_modules/dayjs/dayjs.min.js
var require_dayjs_min = __commonJS({
  "node_modules/dayjs/dayjs.min.js"(exports, module) {
    !(function(t, e) {
      "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).dayjs = e();
    })(exports, (function() {
      "use strict";
      var t = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", c = "month", f = "quarter", h = "year", d = "date", l = "Invalid Date", $ = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(t2) {
        var e2 = ["th", "st", "nd", "rd"], n2 = t2 % 100;
        return "[" + t2 + (e2[(n2 - 20) % 10] || e2[n2] || e2[0]) + "]";
      } }, m = function(t2, e2, n2) {
        var r2 = String(t2);
        return !r2 || r2.length >= e2 ? t2 : "" + Array(e2 + 1 - r2.length).join(n2) + t2;
      }, v = { s: m, z: function(t2) {
        var e2 = -t2.utcOffset(), n2 = Math.abs(e2), r2 = Math.floor(n2 / 60), i2 = n2 % 60;
        return (e2 <= 0 ? "+" : "-") + m(r2, 2, "0") + ":" + m(i2, 2, "0");
      }, m: function t2(e2, n2) {
        if (e2.date() < n2.date()) return -t2(n2, e2);
        var r2 = 12 * (n2.year() - e2.year()) + (n2.month() - e2.month()), i2 = e2.clone().add(r2, c), s2 = n2 - i2 < 0, u2 = e2.clone().add(r2 + (s2 ? -1 : 1), c);
        return +(-(r2 + (n2 - i2) / (s2 ? i2 - u2 : u2 - i2)) || 0);
      }, a: function(t2) {
        return t2 < 0 ? Math.ceil(t2) || 0 : Math.floor(t2);
      }, p: function(t2) {
        return { M: c, y: h, w: o, d: a, D: d, h: u, m: s, s: i, ms: r, Q: f }[t2] || String(t2 || "").toLowerCase().replace(/s$/, "");
      }, u: function(t2) {
        return void 0 === t2;
      } }, g = "en", D = {};
      D[g] = M;
      var p = "$isDayjsObject", S = function(t2) {
        return t2 instanceof _ || !(!t2 || !t2[p]);
      }, w = function t2(e2, n2, r2) {
        var i2;
        if (!e2) return g;
        if ("string" == typeof e2) {
          var s2 = e2.toLowerCase();
          D[s2] && (i2 = s2), n2 && (D[s2] = n2, i2 = s2);
          var u2 = e2.split("-");
          if (!i2 && u2.length > 1) return t2(u2[0]);
        } else {
          var a2 = e2.name;
          D[a2] = e2, i2 = a2;
        }
        return !r2 && i2 && (g = i2), i2 || !r2 && g;
      }, O = function(t2, e2) {
        if (S(t2)) return t2.clone();
        var n2 = "object" == typeof e2 ? e2 : {};
        return n2.date = t2, n2.args = arguments, new _(n2);
      }, b2 = v;
      b2.l = w, b2.i = S, b2.w = function(t2, e2) {
        return O(t2, { locale: e2.$L, utc: e2.$u, x: e2.$x, $offset: e2.$offset });
      };
      var _ = (function() {
        function M2(t2) {
          this.$L = w(t2.locale, null, true), this.parse(t2), this.$x = this.$x || t2.x || {}, this[p] = true;
        }
        var m2 = M2.prototype;
        return m2.parse = function(t2) {
          this.$d = (function(t3) {
            var e2 = t3.date, n2 = t3.utc;
            if (null === e2) return /* @__PURE__ */ new Date(NaN);
            if (b2.u(e2)) return /* @__PURE__ */ new Date();
            if (e2 instanceof Date) return new Date(e2);
            if ("string" == typeof e2 && !/Z$/i.test(e2)) {
              var r2 = e2.match($);
              if (r2) {
                var i2 = r2[2] - 1 || 0, s2 = (r2[7] || "0").substring(0, 3);
                return n2 ? new Date(Date.UTC(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2)) : new Date(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2);
              }
            }
            return new Date(e2);
          })(t2), this.init();
        }, m2.init = function() {
          var t2 = this.$d;
          this.$y = t2.getFullYear(), this.$M = t2.getMonth(), this.$D = t2.getDate(), this.$W = t2.getDay(), this.$H = t2.getHours(), this.$m = t2.getMinutes(), this.$s = t2.getSeconds(), this.$ms = t2.getMilliseconds();
        }, m2.$utils = function() {
          return b2;
        }, m2.isValid = function() {
          return !(this.$d.toString() === l);
        }, m2.isSame = function(t2, e2) {
          var n2 = O(t2);
          return this.startOf(e2) <= n2 && n2 <= this.endOf(e2);
        }, m2.isAfter = function(t2, e2) {
          return O(t2) < this.startOf(e2);
        }, m2.isBefore = function(t2, e2) {
          return this.endOf(e2) < O(t2);
        }, m2.$g = function(t2, e2, n2) {
          return b2.u(t2) ? this[e2] : this.set(n2, t2);
        }, m2.unix = function() {
          return Math.floor(this.valueOf() / 1e3);
        }, m2.valueOf = function() {
          return this.$d.getTime();
        }, m2.startOf = function(t2, e2) {
          var n2 = this, r2 = !!b2.u(e2) || e2, f2 = b2.p(t2), l2 = function(t3, e3) {
            var i2 = b2.w(n2.$u ? Date.UTC(n2.$y, e3, t3) : new Date(n2.$y, e3, t3), n2);
            return r2 ? i2 : i2.endOf(a);
          }, $2 = function(t3, e3) {
            return b2.w(n2.toDate()[t3].apply(n2.toDate("s"), (r2 ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(e3)), n2);
          }, y2 = this.$W, M3 = this.$M, m3 = this.$D, v2 = "set" + (this.$u ? "UTC" : "");
          switch (f2) {
            case h:
              return r2 ? l2(1, 0) : l2(31, 11);
            case c:
              return r2 ? l2(1, M3) : l2(0, M3 + 1);
            case o:
              var g2 = this.$locale().weekStart || 0, D2 = (y2 < g2 ? y2 + 7 : y2) - g2;
              return l2(r2 ? m3 - D2 : m3 + (6 - D2), M3);
            case a:
            case d:
              return $2(v2 + "Hours", 0);
            case u:
              return $2(v2 + "Minutes", 1);
            case s:
              return $2(v2 + "Seconds", 2);
            case i:
              return $2(v2 + "Milliseconds", 3);
            default:
              return this.clone();
          }
        }, m2.endOf = function(t2) {
          return this.startOf(t2, false);
        }, m2.$set = function(t2, e2) {
          var n2, o2 = b2.p(t2), f2 = "set" + (this.$u ? "UTC" : ""), l2 = (n2 = {}, n2[a] = f2 + "Date", n2[d] = f2 + "Date", n2[c] = f2 + "Month", n2[h] = f2 + "FullYear", n2[u] = f2 + "Hours", n2[s] = f2 + "Minutes", n2[i] = f2 + "Seconds", n2[r] = f2 + "Milliseconds", n2)[o2], $2 = o2 === a ? this.$D + (e2 - this.$W) : e2;
          if (o2 === c || o2 === h) {
            var y2 = this.clone().set(d, 1);
            y2.$d[l2]($2), y2.init(), this.$d = y2.set(d, Math.min(this.$D, y2.daysInMonth())).$d;
          } else l2 && this.$d[l2]($2);
          return this.init(), this;
        }, m2.set = function(t2, e2) {
          return this.clone().$set(t2, e2);
        }, m2.get = function(t2) {
          return this[b2.p(t2)]();
        }, m2.add = function(r2, f2) {
          var d2, l2 = this;
          r2 = Number(r2);
          var $2 = b2.p(f2), y2 = function(t2) {
            var e2 = O(l2);
            return b2.w(e2.date(e2.date() + Math.round(t2 * r2)), l2);
          };
          if ($2 === c) return this.set(c, this.$M + r2);
          if ($2 === h) return this.set(h, this.$y + r2);
          if ($2 === a) return y2(1);
          if ($2 === o) return y2(7);
          var M3 = (d2 = {}, d2[s] = e, d2[u] = n, d2[i] = t, d2)[$2] || 1, m3 = this.$d.getTime() + r2 * M3;
          return b2.w(m3, this);
        }, m2.subtract = function(t2, e2) {
          return this.add(-1 * t2, e2);
        }, m2.format = function(t2) {
          var e2 = this, n2 = this.$locale();
          if (!this.isValid()) return n2.invalidDate || l;
          var r2 = t2 || "YYYY-MM-DDTHH:mm:ssZ", i2 = b2.z(this), s2 = this.$H, u2 = this.$m, a2 = this.$M, o2 = n2.weekdays, c2 = n2.months, f2 = n2.meridiem, h2 = function(t3, n3, i3, s3) {
            return t3 && (t3[n3] || t3(e2, r2)) || i3[n3].slice(0, s3);
          }, d2 = function(t3) {
            return b2.s(s2 % 12 || 12, t3, "0");
          }, $2 = f2 || function(t3, e3, n3) {
            var r3 = t3 < 12 ? "AM" : "PM";
            return n3 ? r3.toLowerCase() : r3;
          };
          return r2.replace(y, (function(t3, r3) {
            return r3 || (function(t4) {
              switch (t4) {
                case "YY":
                  return String(e2.$y).slice(-2);
                case "YYYY":
                  return b2.s(e2.$y, 4, "0");
                case "M":
                  return a2 + 1;
                case "MM":
                  return b2.s(a2 + 1, 2, "0");
                case "MMM":
                  return h2(n2.monthsShort, a2, c2, 3);
                case "MMMM":
                  return h2(c2, a2);
                case "D":
                  return e2.$D;
                case "DD":
                  return b2.s(e2.$D, 2, "0");
                case "d":
                  return String(e2.$W);
                case "dd":
                  return h2(n2.weekdaysMin, e2.$W, o2, 2);
                case "ddd":
                  return h2(n2.weekdaysShort, e2.$W, o2, 3);
                case "dddd":
                  return o2[e2.$W];
                case "H":
                  return String(s2);
                case "HH":
                  return b2.s(s2, 2, "0");
                case "h":
                  return d2(1);
                case "hh":
                  return d2(2);
                case "a":
                  return $2(s2, u2, true);
                case "A":
                  return $2(s2, u2, false);
                case "m":
                  return String(u2);
                case "mm":
                  return b2.s(u2, 2, "0");
                case "s":
                  return String(e2.$s);
                case "ss":
                  return b2.s(e2.$s, 2, "0");
                case "SSS":
                  return b2.s(e2.$ms, 3, "0");
                case "Z":
                  return i2;
              }
              return null;
            })(t3) || i2.replace(":", "");
          }));
        }, m2.utcOffset = function() {
          return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
        }, m2.diff = function(r2, d2, l2) {
          var $2, y2 = this, M3 = b2.p(d2), m3 = O(r2), v2 = (m3.utcOffset() - this.utcOffset()) * e, g2 = this - m3, D2 = function() {
            return b2.m(y2, m3);
          };
          switch (M3) {
            case h:
              $2 = D2() / 12;
              break;
            case c:
              $2 = D2();
              break;
            case f:
              $2 = D2() / 3;
              break;
            case o:
              $2 = (g2 - v2) / 6048e5;
              break;
            case a:
              $2 = (g2 - v2) / 864e5;
              break;
            case u:
              $2 = g2 / n;
              break;
            case s:
              $2 = g2 / e;
              break;
            case i:
              $2 = g2 / t;
              break;
            default:
              $2 = g2;
          }
          return l2 ? $2 : b2.a($2);
        }, m2.daysInMonth = function() {
          return this.endOf(c).$D;
        }, m2.$locale = function() {
          return D[this.$L];
        }, m2.locale = function(t2, e2) {
          if (!t2) return this.$L;
          var n2 = this.clone(), r2 = w(t2, e2, true);
          return r2 && (n2.$L = r2), n2;
        }, m2.clone = function() {
          return b2.w(this.$d, this);
        }, m2.toDate = function() {
          return new Date(this.valueOf());
        }, m2.toJSON = function() {
          return this.isValid() ? this.toISOString() : null;
        }, m2.toISOString = function() {
          return this.$d.toISOString();
        }, m2.toString = function() {
          return this.$d.toUTCString();
        }, M2;
      })(), Y = _.prototype;
      return O.prototype = Y, [["$ms", r], ["$s", i], ["$m", s], ["$H", u], ["$W", a], ["$M", c], ["$y", h], ["$D", d]].forEach((function(t2) {
        Y[t2[1]] = function(e2) {
          return this.$g(e2, t2[0], t2[1]);
        };
      })), O.extend = function(t2, e2) {
        return t2.$i || (t2(e2, _, O), t2.$i = true), O;
      }, O.locale = w, O.isDayjs = S, O.unix = function(t2) {
        return O(1e3 * t2);
      }, O.en = D[g], O.Ls = D, O.p = {}, O;
    }));
  }
});

// node_modules/launder/index.js
var require_launder = __commonJS({
  "node_modules/launder/index.js"(exports, module) {
    var dayjs = require_dayjs_min();
    function cleanHref(href) {
      href = href.replace(/[\x00-\x20]+/g, "");
      while (true) {
        const firstIndex = href.indexOf("<!--");
        if (firstIndex === -1) {
          break;
        }
        const lastIndex = href.indexOf("-->", firstIndex + 4);
        if (lastIndex === -1) {
          break;
        }
        href = href.substring(0, firstIndex) + href.substring(lastIndex + 3);
      }
      return href;
    }
    function naughtyHref(href, options) {
      options = options || {};
      const allowedSchemes = options.allowedSchemes || ["http", "https", "ftp", "mailto", "tel", "sms"];
      const allowProtocolRelative = options.allowProtocolRelative !== false;
      if (typeof href !== "string") {
        return false;
      }
      href = cleanHref(href);
      const matches = href.match(/^([a-zA-Z][a-zA-Z0-9.\-+]*):/);
      if (!matches) {
        if (href.match(/^[/\\]{2}/)) {
          return !allowProtocolRelative;
        }
        return false;
      }
      const scheme = matches[1].toLowerCase();
      return allowedSchemes.indexOf(scheme) === -1;
    }
    module.exports = function(options) {
      const self2 = {};
      self2.options = options || {};
      self2.filterTag = self2.options.filterTag || function(tag) {
        tag = tag.trim();
        return tag.toLowerCase();
      };
      self2.string = function(s, def) {
        if (typeof s !== "string") {
          if (typeof s === "number" || typeof s === "boolean") {
            s += "";
          } else {
            s = "";
          }
        }
        s = s.trim();
        if (def !== void 0) {
          if (s === "") {
            s = def;
          }
        }
        return s;
      };
      self2.strings = function(strings) {
        if (!Array.isArray(strings)) {
          return [];
        }
        return strings.map(function(s) {
          return self2.string(s);
        });
      };
      self2.integer = function(i, def, min, max) {
        if (def === void 0) {
          def = 0;
        }
        if (typeof i === "number") {
          i = Math.floor(i);
        } else {
          try {
            i = parseInt(i, 10);
            if (isNaN(i)) {
              i = def;
            }
          } catch (e) {
            i = def;
          }
        }
        if (typeof min === "number" && i < min) {
          i = min;
        }
        if (typeof max === "number" && i > max) {
          i = max;
        }
        return i;
      };
      self2.padInteger = function(i, places) {
        let s = i + "";
        while (s.length < places) {
          s = "0" + s;
        }
        return s;
      };
      self2.float = function(i, def, min, max) {
        if (def === void 0) {
          def = 0;
        }
        if (!(typeof i === "number")) {
          try {
            i = parseFloat(i, 10);
            if (isNaN(i)) {
              i = def;
            }
          } catch (e) {
            i = def;
          }
        }
        if (typeof min === "number" && i < min) {
          i = min;
        }
        if (typeof max === "number" && i > max) {
          i = max;
        }
        return i;
      };
      self2.naughtyHref = naughtyHref;
      self2.url = function(s, def, httpsFix) {
        s = self2.string(s, def);
        if (s === def) {
          return s;
        }
        s = cleanHref(s);
        if (naughtyHref(s)) {
          return def;
        }
        s = fixUrl(s);
        if (s === null) {
          return def;
        }
        return s;
        function fixUrl(href) {
          if (href.match(/^(((https?|ftp):\/\/)|((mailto|tel|sms):)|#|([^/.]+)?\/|[^/.]+$)/)) {
            return href;
          } else if (href.match(/^[^/.]+\.[^/.]+/)) {
            const protocol = httpsFix ? "https://" : "http://";
            return protocol + href;
          } else {
            return null;
          }
        }
        ;
      };
      self2.select = function(s, choices, def) {
        s = self2.string(s);
        if (!choices || !choices.length) {
          return def;
        }
        let choice;
        if (typeof choices[0] === "object") {
          choice = choices.find(function(choice2) {
            if (choice2.value === null || choice2.value === void 0) {
              return false;
            }
            return choice2.value.toString() === s;
          });
          if (choice != null) {
            return choice.value;
          }
          return def;
        }
        choice = choices.find(function(choice2) {
          if (choice2 === null || choice2 === void 0) {
            return false;
          }
          return choice2.toString() === s;
        });
        if (choice !== void 0) {
          return choice;
        }
        return def;
      };
      self2.boolean = function(b2, def) {
        if (b2 === true) {
          return true;
        }
        if (b2 === false) {
          return false;
        }
        b2 = self2.string(b2, def);
        if (b2 === def) {
          if (b2 === void 0) {
            return false;
          }
          return b2;
        }
        b2 = b2.toLowerCase().charAt(0);
        if (b2 === "" || b2 === "n" || b2 === "0" || b2 === "f") {
          return false;
        }
        if (b2 === "t" || b2 === "y" || b2 === "1") {
          return true;
        }
        return false;
      };
      self2.addBooleanFilterToCriteria = function(options2, name, criteria, def) {
        if (def === void 0) {
          def = null;
        }
        let value = typeof options2 === "object" && options2 !== null ? options2[name] : options2;
        value = value === void 0 ? def : value;
        value = self2.booleanOrNull(value);
        if (value === null) {
        } else if (!value) {
          criteria[name] = { $ne: true };
        } else {
          criteria[name] = true;
        }
      };
      self2.booleanOrNull = function(b2, def) {
        if (b2 === true) {
          return b2;
        }
        if (b2 === false) {
          return b2;
        }
        if (b2 === null) {
          return b2;
        }
        b2 = self2.string(b2, def);
        if (b2 === def) {
          if (def === void 0) {
            return null;
          }
          return b2;
        }
        if (b2 === "null") {
          return null;
        }
        b2 = b2.toLowerCase().charAt(0);
        if (b2 === "" || b2 === "n" || b2 === "0" || b2 === "f") {
          return false;
        }
        if (b2 === "t" || b2 === "y" || b2 === "1") {
          return true;
        }
        if (b2 === "a") {
          return null;
        }
        return def;
      };
      self2.date = function(date, def, now) {
        let components;
        function returnDefault() {
          if (def === void 0) {
            def = dayjs().format("YYYY-MM-DD");
          }
          return def;
        }
        if (typeof date === "string") {
          if (date.match(/\//)) {
            components = date.split("/");
            if (components.length === 2) {
              return (now || /* @__PURE__ */ new Date()).getFullYear() + "-" + self2.padInteger(components[0], 2) + "-" + self2.padInteger(components[1], 2);
            } else if (components.length === 3) {
              if (components[2] < 100) {
                const d = now || /* @__PURE__ */ new Date();
                const nowYear = d.getFullYear() % 100;
                const nowCentury = d.getFullYear() - nowYear;
                let theirYear = parseInt(components[2]) + nowCentury;
                if (theirYear - d.getFullYear() > 50) {
                  theirYear -= 100;
                }
                components[2] = theirYear;
              }
              return self2.padInteger(components[2], 4) + "-" + self2.padInteger(components[0], 2) + "-" + self2.padInteger(components[1], 2);
            } else {
              return returnDefault();
            }
          } else if (date.match(/-/)) {
            components = date.split("-");
            if (components.length === 2) {
              return (now || /* @__PURE__ */ new Date()).getFullYear() + "-" + self2.padInteger(components[0], 2) + "-" + self2.padInteger(components[1], 2);
            } else if (components.length === 3) {
              return self2.padInteger(components[0], 4) + "-" + self2.padInteger(components[1], 2) + "-" + self2.padInteger(components[2], 2);
            } else {
              return returnDefault();
            }
          }
        }
        try {
          if (date === null) {
            return returnDefault();
          }
          date = now || new Date(date);
          if (isNaN(date.getTime())) {
            return returnDefault();
          }
          return date.getFullYear() + "-" + self2.padInteger(date.getMonth() + 1, 2) + "-" + self2.padInteger(date.getDate(), 2);
        } catch (e) {
          return returnDefault();
        }
      };
      self2.formatDate = function(date) {
        return dayjs(date).format("YYYY-MM-DD");
      };
      self2.time = function(time, def) {
        time = self2.string(time).toLowerCase();
        time = time.trim();
        const components = time.match(/^(\d+)([:|.](\d+))?([:|.](\d+))?\s*(am|pm|AM|PM|a|p|A|M)?$/);
        if (components) {
          let hours = parseInt(components[1], 10);
          const minutes = components[3] !== void 0 ? parseInt(components[3], 10) : 0;
          const seconds = components[5] !== void 0 ? parseInt(components[5], 10) : 0;
          let ampm = components[6] ? components[6].toLowerCase() : components[6];
          ampm = ampm && ampm.charAt(0);
          if (hours === 12 && ampm === "a") {
            hours -= 12;
          } else if (hours === 12 && ampm === "p") {
          } else if (ampm === "p") {
            hours += 12;
          }
          if (hours === 24 || hours === "24") {
            hours = 0;
          }
          return self2.padInteger(hours, 2) + ":" + self2.padInteger(minutes, 2) + ":" + self2.padInteger(seconds, 2);
        } else {
          if (def !== void 0) {
            return def;
          }
          return dayjs().format("HH:mm");
        }
      };
      self2.formatTime = function(date) {
        return dayjs(date).format("HH:mm:ss");
      };
      self2.tags = function(tags, filter2) {
        if (typeof tags === "string") {
          tags = tags.split(/,\s*/);
        }
        if (!Array.isArray(tags)) {
          return [];
        }
        const strings = tags.map((tag) => self2.string(tag));
        const rewritten = strings.map(filter2 || self2.filterTag);
        const filtered = rewritten.filter((tag) => tag.length > 0);
        return filtered;
      };
      self2.idRegExp = self2.options.idRegExp || /^[A-Za-z0-9_]+$/;
      self2.id = function(s, def) {
        const id = self2.string(s, def);
        if (id === def) {
          return id;
        }
        if (!id.match(self2.idRegExp)) {
          return def;
        }
        return id;
      };
      self2.ids = function(ids) {
        if (!Array.isArray(ids)) {
          return [];
        }
        const result = ids.filter(function(id) {
          return self2.id(id) !== void 0;
        });
        return result;
      };
      return self2;
    };
    module.exports.naughtyHref = naughtyHref;
  }
});

// node_modules/sanitize-html/index.js
var require_sanitize_html = __commonJS({
  "node_modules/sanitize-html/index.js"(exports, module) {
    var htmlparser = (init_dist6(), __toCommonJS(dist_exports3));
    var escapeStringRegexp = require_escape_string_regexp();
    var { isPlainObject } = require_is_plain_object();
    var parseSrcset = require_parse_srcset();
    var { parse: postcssParse } = require_postcss();
    var { naughtyHref: launderNaughtyHref } = require_launder();
    var mediaTags = [
      "img",
      "audio",
      "video",
      "picture",
      "svg",
      "object",
      "map",
      "iframe",
      "embed"
    ];
    var vulnerableTags = ["script", "style"];
    var svgAnimationTags = [
      "animate",
      "animatecolor",
      "animatemotion",
      "animatetransform",
      "set"
    ];
    var alwaysUrlAttributes = ["href"];
    var severities = ["debug", "info", "warn", "error"];
    function loggerFor(options) {
      const source = options && options.logger || console;
      const logger = {};
      for (const severity of severities) {
        logger[severity] = typeof source[severity] === "function" ? (...args) => source[severity](...args) : (...args) => console[severity](...args);
      }
      return logger;
    }
    function each(obj, cb) {
      if (obj) {
        Object.keys(obj).forEach(function(key) {
          cb(obj[key], key);
        });
      }
    }
    function has(obj, key) {
      return {}.hasOwnProperty.call(obj, key);
    }
    function mergeClasses(specific, wildcard) {
      if (!Array.isArray(specific) || !Array.isArray(wildcard)) {
        return wildcard;
      }
      return specific.concat(wildcard);
    }
    function mergeStyles(specific, wildcard) {
      const merged = /* @__PURE__ */ Object.create(null);
      for (const rules of [specific, wildcard]) {
        for (const prop of Object.keys(rules)) {
          merged[prop] = has(merged, prop) ? merged[prop].concat(rules[prop]) : rules[prop];
        }
      }
      return merged;
    }
    function filter2(a, cb) {
      const n = [];
      each(a, function(v) {
        if (cb(v)) {
          n.push(v);
        }
      });
      return n;
    }
    function isEmptyObject(obj) {
      for (const key in obj) {
        if (has(obj, key)) {
          return false;
        }
      }
      return true;
    }
    function stringifySrcset(parsedSrcset) {
      return parsedSrcset.map(function(part) {
        if (!part.url) {
          throw new Error("URL missing");
        }
        return part.url + (part.w ? ` ${part.w}w` : "") + (part.h ? ` ${part.h}h` : "") + (part.d ? ` ${part.d}x` : "");
      }).join(", ");
    }
    module.exports = sanitizeHtml2;
    var VALID_HTML_ATTRIBUTE_NAME = /^[^\0\t\n\f\r /<=>]+$/;
    var MAX_IFRAME_FALLBACK_DEPTH = 8;
    function sanitizeHtml2(html, options, _fallback) {
      if (html == null) {
        return "";
      }
      const baseDepth = _fallback && _fallback.depth || 0;
      const iframeFallbackDepth = _fallback && _fallback.iframeFallbackDepth || 0;
      if (typeof html === "number") {
        html = html.toString();
      }
      let result = "";
      let tempResult = "";
      function Frame(tag, attribs) {
        const that = this;
        this.tag = tag;
        this.attribs = attribs || {};
        this.tagPosition = result.length;
        this.text = "";
        this.openingTagLength = 0;
        this.mediaChildren = [];
        this.updateParentNodeText = function() {
          if (stack.length) {
            const parentFrame = stack[stack.length - 1];
            parentFrame.text += that.text;
          }
        };
        this.updateParentNodeMediaChildren = function() {
          if (stack.length && mediaTags.includes(this.tag)) {
            const parentFrame = stack[stack.length - 1];
            parentFrame.mediaChildren.push(this.tag);
          }
        };
      }
      options = Object.assign({}, sanitizeHtml2.defaults, options);
      options.parser = Object.assign({}, htmlParserDefaults, options.parser);
      if (typeof html === "string" && !options.parser.xmlMode) {
        html = html.replaceAll("<![CDATA[", "<!&#91;CDATA[");
      }
      const logger = loggerFor(options);
      const tagAllowed = function(name) {
        return options.allowedTags === false || (options.allowedTags || []).indexOf(name) > -1;
      };
      vulnerableTags.forEach(function(tag) {
        if (tagAllowed(tag) && !options.allowVulnerableTags) {
          logger.warn(
            `Your \`allowedTags\` option includes \`${tag}\`, which is inherently vulnerable to XSS attacks. Please remove it from \`allowedTags\`, or, to disable this warning, add the \`allowVulnerableTags\` option and ensure you are accounting for this risk.`
          );
        }
      });
      const nonTextTagsArray = options.nonTextTags || [
        "script",
        "style",
        "textarea",
        "option",
        "xmp"
      ];
      let allowedAttributesMap;
      let allowedAttributesGlobMap;
      if (options.allowedAttributes) {
        allowedAttributesMap = {};
        allowedAttributesGlobMap = {};
        each(options.allowedAttributes, function(attributes, tag) {
          allowedAttributesMap[tag] = [];
          const globRegex = [];
          attributes.forEach(function(obj) {
            if (typeof obj === "string" && obj.indexOf("*") >= 0) {
              globRegex.push(escapeStringRegexp(obj).replace(/\\\*/g, ".*"));
            } else {
              allowedAttributesMap[tag].push(obj);
            }
          });
          if (globRegex.length) {
            allowedAttributesGlobMap[tag] = new RegExp("^(" + globRegex.join("|") + ")$");
          }
        });
      }
      const allowedClassesMap = {};
      const allowedClassesGlobMap = {};
      const allowedClassesRegexMap = {};
      each(options.allowedClasses, function(classes, tag) {
        if (allowedAttributesMap) {
          if (!has(allowedAttributesMap, tag)) {
            allowedAttributesMap[tag] = [];
          }
          allowedAttributesMap[tag].push("class");
        }
        allowedClassesMap[tag] = classes;
        if (Array.isArray(classes)) {
          const globRegex = [];
          allowedClassesMap[tag] = [];
          allowedClassesRegexMap[tag] = [];
          classes.forEach(function(obj) {
            if (typeof obj === "string" && obj.indexOf("*") >= 0) {
              globRegex.push(escapeStringRegexp(obj).replace(/\\\*/g, ".*"));
            } else if (obj instanceof RegExp) {
              allowedClassesRegexMap[tag].push(obj);
            } else {
              allowedClassesMap[tag].push(obj);
            }
          });
          if (globRegex.length) {
            allowedClassesGlobMap[tag] = new RegExp("^(" + globRegex.join("|") + ")$");
          }
        }
      });
      const transformTagsMap = {};
      let transformTagsAll;
      each(options.transformTags, function(transform, tag) {
        let transFun;
        if (typeof transform === "function") {
          transFun = transform;
        } else if (typeof transform === "string") {
          transFun = sanitizeHtml2.simpleTransform(transform);
        }
        if (tag === "*") {
          transformTagsAll = transFun;
        } else {
          transformTagsMap[tag] = transFun;
        }
      });
      let depth;
      let stack;
      let skipMap;
      let transformMap;
      let skipText;
      let skipTextDepth;
      let rawTextEnd;
      let skipRawText;
      let addedText = false;
      initializeState();
      const parser = new htmlparser.Parser({
        onopentag: function(name, attribs) {
          if (options.onOpenTag) {
            options.onOpenTag(name, attribs);
          }
          updateRawTextRegion();
          if (options.enforceHtmlBoundary && name === "html") {
            initializeState();
          }
          if (skipRawText) {
            return;
          }
          if (skipText) {
            skipTextDepth++;
            return;
          }
          const frame = new Frame(name, attribs);
          stack.push(frame);
          let skip = false;
          const hasText = !!frame.text;
          let transformedTag;
          if (has(transformTagsMap, name)) {
            transformedTag = transformTagsMap[name](name, attribs);
            frame.attribs = attribs = transformedTag.attribs;
            if (transformedTag.text !== void 0) {
              frame.innerText = transformedTag.text;
            }
            if (name !== transformedTag.tagName) {
              frame.name = name = transformedTag.tagName;
              transformMap[depth] = transformedTag.tagName;
            }
          }
          if (transformTagsAll) {
            transformedTag = transformTagsAll(name, attribs);
            frame.attribs = attribs = transformedTag.attribs;
            if (name !== transformedTag.tagName) {
              frame.name = name = transformedTag.tagName;
              transformMap[depth] = transformedTag.tagName;
            }
          }
          if (!tagAllowed(name) || animatesUrlAttribute(name, attribs) || options.disallowedTagsMode === "recursiveEscape" && !isEmptyObject(skipMap) || options.nestingLimit != null && depth >= options.nestingLimit) {
            skip = true;
            skipMap[depth] = true;
            if (options.disallowedTagsMode === "discard" || options.disallowedTagsMode === "completelyDiscard") {
              if (nonTextTagsArray.indexOf(name) !== -1) {
                skipText = true;
                skipTextDepth = 1;
                if (frame.tag.toLowerCase() === "noscript") {
                  rawTextEnd = findRawTextEnd("noscript", parser.endIndex + 1);
                }
              }
            }
          }
          depth++;
          if (skip) {
            if (options.disallowedTagsMode === "discard" || options.disallowedTagsMode === "completelyDiscard") {
              if (frame.innerText && !hasText) {
                const escaped = escapeHtml(frame.innerText);
                if (options.textFilter) {
                  result += options.textFilter(escaped, name);
                } else {
                  result += escaped;
                }
                addedText = true;
              }
              return;
            }
            tempResult = result;
            result = "";
          }
          result += "<" + name;
          if (name === "script") {
            if (options.allowedScriptHostnames || options.allowedScriptDomains) {
              frame.innerText = "";
            }
          }
          const isBeingEscaped = skip && (options.disallowedTagsMode === "escape" || options.disallowedTagsMode === "recursiveEscape");
          const shouldPreserveEscapedAttributes = isBeingEscaped && options.preserveEscapedAttributes;
          if (shouldPreserveEscapedAttributes) {
            each(attribs, function(value, a) {
              result += " " + a + '="' + escapeHtml(value || "", true) + '"';
            });
          } else if (!allowedAttributesMap || has(allowedAttributesMap, name) || allowedAttributesMap["*"]) {
            each(attribs, function(value, a) {
              if (!VALID_HTML_ATTRIBUTE_NAME.test(a)) {
                delete frame.attribs[a];
                return;
              }
              if (value === "" && !options.allowedEmptyAttributes.includes(a) && (options.nonBooleanAttributes.includes(a) || options.nonBooleanAttributes.includes("*"))) {
                delete frame.attribs[a];
                return;
              }
              let passedAllowedAttributesMapCheck = false;
              if (!allowedAttributesMap || has(allowedAttributesMap, name) && allowedAttributesMap[name].indexOf(a) !== -1 || allowedAttributesMap["*"] && allowedAttributesMap["*"].indexOf(a) !== -1 || has(allowedAttributesGlobMap, name) && allowedAttributesGlobMap[name].test(a) || allowedAttributesGlobMap["*"] && allowedAttributesGlobMap["*"].test(a)) {
                passedAllowedAttributesMapCheck = true;
              } else if (allowedAttributesMap && allowedAttributesMap[name]) {
                for (const o of allowedAttributesMap[name]) {
                  if (isPlainObject(o) && o.name && o.name === a) {
                    passedAllowedAttributesMapCheck = true;
                    let newValue = "";
                    if (o.multiple === true) {
                      const splitStrArray = value.split(" ");
                      for (const s of splitStrArray) {
                        if (o.values.indexOf(s) !== -1) {
                          if (newValue === "") {
                            newValue = s;
                          } else {
                            newValue += " " + s;
                          }
                        }
                      }
                    } else if (o.values.indexOf(value) >= 0) {
                      newValue = value;
                    }
                    value = newValue;
                  }
                }
              }
              if (passedAllowedAttributesMapCheck) {
                if (options.allowedSchemesAppliedToAttributes.indexOf(a) !== -1) {
                  if (naughtyHref(name, value)) {
                    delete frame.attribs[a];
                    return;
                  }
                }
                if (name === "meta" && a.toLowerCase() === "content" && isRefresh(attribs) && naughtyRefresh(value)) {
                  delete frame.attribs[a];
                  return;
                }
                if (name === "script" && a === "src") {
                  let allowed = true;
                  try {
                    const parsed = parseUrl2(value);
                    if (options.allowedScriptHostnames || options.allowedScriptDomains) {
                      const allowedHostname = (options.allowedScriptHostnames || []).find(function(hostname) {
                        return hostname === parsed.url.hostname;
                      });
                      const allowedDomain = (options.allowedScriptDomains || []).find(function(domain) {
                        return parsed.url.hostname === domain || parsed.url.hostname.endsWith(`.${domain}`);
                      });
                      allowed = allowedHostname || allowedDomain;
                    }
                  } catch (e) {
                    allowed = false;
                  }
                  if (!allowed) {
                    delete frame.attribs[a];
                    return;
                  }
                }
                if (name === "iframe" && a === "src") {
                  let allowed = true;
                  try {
                    const parsed = parseUrl2(value);
                    if (parsed.isRelativeUrl) {
                      allowed = has(options, "allowIframeRelativeUrls") ? options.allowIframeRelativeUrls : !options.allowedIframeHostnames && !options.allowedIframeDomains;
                    } else if (options.allowedIframeHostnames || options.allowedIframeDomains) {
                      const allowedHostname = (options.allowedIframeHostnames || []).find(function(hostname) {
                        return hostname === parsed.url.hostname;
                      });
                      const allowedDomain = (options.allowedIframeDomains || []).find(function(domain) {
                        return parsed.url.hostname === domain || parsed.url.hostname.endsWith(`.${domain}`);
                      });
                      allowed = allowedHostname || allowedDomain;
                    }
                  } catch (e) {
                    allowed = false;
                  }
                  if (!allowed) {
                    delete frame.attribs[a];
                    return;
                  }
                }
                if (a === "srcset" || a === "imagesrcset") {
                  try {
                    let parsed = parseSrcset(value);
                    parsed.forEach(function(value2) {
                      if (naughtyHref(name, value2.url)) {
                        value2.evil = true;
                      }
                    });
                    parsed = filter2(parsed, function(v) {
                      return !v.evil;
                    });
                    if (!parsed.length) {
                      delete frame.attribs[a];
                      return;
                    } else {
                      value = stringifySrcset(filter2(parsed, function(v) {
                        return !v.evil;
                      }));
                      frame.attribs[a] = value;
                    }
                  } catch (e) {
                    delete frame.attribs[a];
                    return;
                  }
                }
                if (a === "class") {
                  const allowedSpecificClasses = allowedClassesMap[name];
                  const allowedWildcardClasses = allowedClassesMap["*"];
                  const allowedSpecificClassesGlob = allowedClassesGlobMap[name];
                  const allowedSpecificClassesRegex = allowedClassesRegexMap[name];
                  const allowedWildcardClassesRegex = allowedClassesRegexMap["*"];
                  const allowedWildcardClassesGlob = allowedClassesGlobMap["*"];
                  const allowedClassesGlobs = [
                    allowedSpecificClassesGlob,
                    allowedWildcardClassesGlob
                  ].concat(allowedSpecificClassesRegex, allowedWildcardClassesRegex).filter(function(t) {
                    return t;
                  });
                  if (allowedSpecificClasses && allowedWildcardClasses) {
                    value = filterClasses(
                      value,
                      mergeClasses(allowedSpecificClasses, allowedWildcardClasses),
                      allowedClassesGlobs
                    );
                  } else {
                    value = filterClasses(
                      value,
                      allowedSpecificClasses || allowedWildcardClasses,
                      allowedClassesGlobs
                    );
                  }
                  if (!value.length) {
                    delete frame.attribs[a];
                    return;
                  }
                }
                if (a === "style") {
                  if (options.parseStyleAttributes) {
                    try {
                      const abstractSyntaxTree = postcssParse(name + " {" + value + "}", { map: false });
                      const filteredAST = filterCss(
                        abstractSyntaxTree,
                        options.allowedStyles
                      );
                      value = stringifyStyleAttributes(filteredAST);
                      if (value.length === 0) {
                        delete frame.attribs[a];
                        return;
                      }
                    } catch (e) {
                      if (typeof window !== "undefined") {
                        logger.warn(
                          `Failed to parse "${name} {${value}}". If you are running this in a browser, we recommend disabling style parsing with the parseStyleAttributes option, since it only works in a node environment due to a postcss dependency. More info: https://github.com/apostrophecms/sanitize-html/issues/547`
                        );
                      }
                      delete frame.attribs[a];
                      return;
                    }
                  } else if (options.allowedStyles) {
                    throw new Error("allowedStyles option cannot be used together with parseStyleAttributes: false.");
                  }
                }
                result += " " + a;
                if (value && value.length) {
                  result += '="' + escapeHtml(value, true) + '"';
                } else if (options.allowedEmptyAttributes.includes(a)) {
                  result += '=""';
                }
              } else {
                delete frame.attribs[a];
              }
            });
          }
          if (options.selfClosing.indexOf(name) !== -1) {
            result += " />";
          } else {
            result += ">";
            if (frame.innerText && !hasText) {
              const escaped = escapeHtml(frame.innerText);
              if (options.textFilter) {
                result += options.textFilter(escaped, name);
              } else {
                result += escaped;
              }
              addedText = true;
            }
          }
          if (skip) {
            result = tempResult + escapeHtml(result);
            tempResult = "";
          }
          frame.openingTagLength = result.length - frame.tagPosition;
        },
        ontext: function(text) {
          updateRawTextRegion();
          if (skipText || skipRawText) {
            return;
          }
          const lastFrame = stack[stack.length - 1];
          let tag;
          if (lastFrame) {
            tag = lastFrame.tag;
            text = lastFrame.innerText !== void 0 ? lastFrame.innerText : text;
          }
          if (options.disallowedTagsMode === "completelyDiscard" && !tagAllowed(tag)) {
            text = "";
          } else if (tag && tagAllowed(tag) && (options.disallowedTagsMode === "discard" || options.disallowedTagsMode === "completelyDiscard") && tag === "script") {
            result += text;
          } else if (tag && tagAllowed(tag) && (options.disallowedTagsMode === "discard" || options.disallowedTagsMode === "completelyDiscard") && tag === "style") {
            result += stack.some((frame) => [frame.tag, frame.name].some(
              (name) => name === "svg" || name === "math"
            )) ? text.replace(/</g, "\\3c ") : text;
          } else if (tag && tagAllowed(tag) && (options.disallowedTagsMode === "discard" || options.disallowedTagsMode === "completelyDiscard") && (tag === "textarea" || tag === "xmp")) {
            if (tag === "xmp") {
              result += text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            } else {
              result += escapeHtml(text, false);
            }
          } else if (
            // htmlparser2 treats <iframe> as a raw-text element, so markup inside
            // (including after an unclosed <iframe>) arrives as a single text node.
            // When the iframe is discarded, re-sanitize that fallback markup as HTML
            // instead of escaping it as plain text (issue #5550).
            // The nested call continues from the current depth so that
            // `nestingLimit` applies to the whole output.
            tag === "iframe" && !tagAllowed(tag) && options.disallowedTagsMode === "discard" && iframeFallbackDepth < MAX_IFRAME_FALLBACK_DEPTH
          ) {
            result += sanitizeHtml2(text, options, {
              depth,
              iframeFallbackDepth: iframeFallbackDepth + 1
            });
          } else if (!addedText) {
            const escaped = escapeHtml(text, false);
            if (options.textFilter) {
              result += options.textFilter(escaped, tag);
            } else {
              result += escaped;
            }
          }
          if (stack.length) {
            const frame = stack[stack.length - 1];
            frame.text += text;
          }
        },
        onclosetag: function(name, isImplied) {
          if (options.onCloseTag) {
            options.onCloseTag(name, isImplied);
          }
          updateRawTextRegion();
          if (skipRawText) {
            const lastFrame = stack[stack.length - 1];
            if (!lastFrame || lastFrame.tag !== name) {
              return;
            }
          } else if (skipText) {
            skipTextDepth--;
            if (!skipTextDepth) {
              skipText = false;
              if (rawTextEnd !== null) {
                skipRawText = true;
              }
            } else {
              return;
            }
          }
          const frame = stack.pop();
          if (!frame) {
            return;
          }
          if (frame.tag !== name) {
            stack.push(frame);
            return;
          }
          skipText = options.enforceHtmlBoundary ? name === "html" : false;
          depth--;
          const skip = skipMap[depth];
          if (skip) {
            delete skipMap[depth];
            if (options.disallowedTagsMode === "discard" || options.disallowedTagsMode === "completelyDiscard") {
              frame.updateParentNodeText();
              return;
            }
            tempResult = result;
            result = "";
          }
          if (transformMap[depth]) {
            name = transformMap[depth];
            delete transformMap[depth];
          }
          if (options.exclusiveFilter) {
            const filterResult = options.exclusiveFilter(frame);
            if (filterResult === "excludeTag") {
              if (skip) {
                result = tempResult;
                tempResult = "";
              }
              result = result.substring(0, frame.tagPosition) + result.substring(frame.tagPosition + frame.openingTagLength);
              return;
            } else if (filterResult) {
              result = result.substring(0, frame.tagPosition);
              return;
            }
          }
          frame.updateParentNodeMediaChildren();
          frame.updateParentNodeText();
          if (
            // Already output />
            options.selfClosing.indexOf(name) !== -1 || // Escaped tag, closing tag is implied
            isImplied && !tagAllowed(name) && ["escape", "recursiveEscape"].indexOf(options.disallowedTagsMode) >= 0
          ) {
            if (skip) {
              result = tempResult;
              tempResult = "";
            }
            return;
          }
          result += "</" + name + ">";
          if (skip) {
            result = tempResult + escapeHtml(result);
            tempResult = "";
          }
          addedText = false;
        }
      }, options.parser);
      parser.write(html);
      parser.end();
      if (options.disallowedTagsMode === "escape" || options.disallowedTagsMode === "recursiveEscape") {
        const lastParsedIndex = parser.endIndex;
        if (lastParsedIndex != null && lastParsedIndex >= 0 && lastParsedIndex < html.length) {
          const unparsed = html.substring(lastParsedIndex);
          result += escapeHtml(unparsed);
        } else if ((lastParsedIndex == null || lastParsedIndex < 0) && html.length > 0 && result === "") {
          result = escapeHtml(html);
        }
      }
      return result;
      function initializeState() {
        result = "";
        depth = baseDepth;
        stack = [];
        skipMap = {};
        transformMap = {};
        skipText = false;
        skipTextDepth = 0;
        rawTextEnd = null;
        skipRawText = false;
      }
      function updateRawTextRegion() {
        if (rawTextEnd !== null && parser.startIndex >= rawTextEnd) {
          rawTextEnd = null;
          skipRawText = false;
        }
      }
      function findRawTextEnd(tagName, from) {
        const re = new RegExp("</" + tagName + "[\\t\\n\\f\\r />]", "ig");
        re.lastIndex = from;
        const match = re.exec(html);
        return match ? match.index : Infinity;
      }
      function escapeHtml(s, quote) {
        if (typeof s !== "string") {
          s = s + "";
        }
        if (options.parser.decodeEntities) {
          s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          if (quote) {
            s = s.replace(/"/g, "&quot;");
          }
        }
        s = s.replace(/&(?![a-zA-Z0-9#]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (quote) {
          s = s.replace(/"/g, "&quot;");
        }
        return s;
      }
      function naughtyHref(name, href) {
        const allowedSchemes = has(options.allowedSchemesByTag, name) ? options.allowedSchemesByTag[name] : options.allowedSchemes || [];
        return launderNaughtyHref(href, {
          allowedSchemes,
          allowProtocolRelative: options.allowProtocolRelative
        });
      }
      function isRefresh(attribs) {
        return Object.keys(attribs).some(function(a) {
          return a.toLowerCase() === "http-equiv" && String(attribs[a]).trim().toLowerCase() === "refresh";
        });
      }
      function naughtyRefresh(content) {
        const input = String(content);
        const isWhitespace2 = function(c) {
          return c === " " || c === "	" || c === "\n" || c === "\f" || c === "\r";
        };
        let position = 0;
        const skipWhitespace = function() {
          while (position < input.length && isWhitespace2(input[position])) {
            position++;
          }
        };
        const lowerAt = function(i) {
          return (input[i] || "").toLowerCase();
        };
        skipWhitespace();
        const timeStart = position;
        while (position < input.length && /[0-9.]/.test(input[position])) {
          position++;
        }
        if (position === timeStart) {
          return true;
        }
        if (position < input.length) {
          const c = input[position];
          if (c !== ";" && c !== "," && !isWhitespace2(c)) {
            return true;
          }
          skipWhitespace();
          if (input[position] === ";" || input[position] === ",") {
            position++;
          }
          skipWhitespace();
        }
        if (position >= input.length) {
          return false;
        }
        let url = input.slice(position);
        let quoted = true;
        if (lowerAt(position) === "u") {
          quoted = false;
          if (lowerAt(position + 1) === "r" && lowerAt(position + 2) === "l") {
            position += 3;
            skipWhitespace();
            if (input[position] === "=") {
              position++;
              skipWhitespace();
              quoted = true;
            }
          }
        }
        if (quoted) {
          const quote = input[position];
          if (quote === '"' || quote === "'") {
            position++;
          }
          url = input.slice(position);
          if (quote === '"' || quote === "'") {
            const end = url.indexOf(quote);
            if (end !== -1) {
              url = url.slice(0, end);
            }
          }
        }
        return naughtyHref("meta", url);
      }
      function animatesUrlAttribute(name, attribs) {
        if (!nameParts(name).some((part) => svgAnimationTags.includes(part))) {
          return false;
        }
        const schemeCheckedAttributes = options.allowedSchemesAppliedToAttributes || [];
        return Object.keys(attribs || {}).some(function(attributeName) {
          if (!nameParts(attributeName).includes("attributename")) {
            return false;
          }
          const target = (attribs[attributeName] || "").trim().toLowerCase();
          return schemeCheckedAttributes.includes(target) || nameParts(target).some((part) => alwaysUrlAttributes.includes(part) || schemeCheckedAttributes.includes(part));
        });
      }
      function nameParts(name) {
        return name.toLowerCase().split(":").map((part) => part.trim());
      }
      function parseUrl2(value) {
        value = value.replace(/^(\w+:)?\s*[\\/]\s*[\\/]/, "$1//");
        if (value.startsWith("relative:")) {
          throw new Error("relative: exploit attempt");
        }
        let base = "relative://relative-site";
        for (let i = 0; i < 100; i++) {
          base += `/${i}`;
        }
        const parsed = new URL(value, base);
        const isRelativeUrl = parsed && parsed.hostname === "relative-site" && parsed.protocol === "relative:";
        return {
          isRelativeUrl,
          url: parsed
        };
      }
      function filterCss(abstractSyntaxTree, allowedStyles) {
        if (!allowedStyles) {
          return abstractSyntaxTree;
        }
        const astRules = abstractSyntaxTree.nodes[0];
        let selectedRule;
        if (allowedStyles[astRules.selector] && allowedStyles["*"]) {
          selectedRule = mergeStyles(
            allowedStyles[astRules.selector],
            allowedStyles["*"]
          );
        } else {
          selectedRule = allowedStyles[astRules.selector] || allowedStyles["*"];
        }
        if (selectedRule) {
          abstractSyntaxTree.nodes[0].nodes = astRules.nodes.reduce(filterDeclarations(selectedRule), []);
        }
        return abstractSyntaxTree;
      }
      function stringifyStyleAttributes(filteredAST) {
        return filteredAST.nodes[0].nodes.reduce(function(extractedAttributes, attrObject) {
          extractedAttributes.push(
            `${attrObject.prop}:${attrObject.value}${attrObject.important ? " !important" : ""}`
          );
          return extractedAttributes;
        }, []).join(";");
      }
      function filterDeclarations(selectedRule) {
        return function(allowedDeclarationsList, attributeObject) {
          if (has(selectedRule, attributeObject.prop)) {
            const matchesRegex = selectedRule[attributeObject.prop].some(function(regularExpression) {
              return regularExpression.test(attributeObject.value);
            });
            if (matchesRegex) {
              allowedDeclarationsList.push(attributeObject);
            }
          }
          return allowedDeclarationsList;
        };
      }
      function filterClasses(classes, allowed, allowedGlobs) {
        if (!allowed) {
          return classes;
        }
        classes = classes.split(/\s+/);
        return classes.filter(function(clss) {
          return allowed.indexOf(clss) !== -1 || allowedGlobs.some(function(glob) {
            return glob.test(clss);
          });
        }).join(" ");
      }
    }
    var htmlParserDefaults = {
      decodeEntities: true
    };
    sanitizeHtml2.defaults = {
      allowedTags: [
        // Sections derived from MDN element categories and limited to the more
        // benign categories.
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element
        // Content sectioning
        "address",
        "article",
        "aside",
        "footer",
        "header",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hgroup",
        "main",
        "nav",
        "section",
        // Text content
        "blockquote",
        "dd",
        "div",
        "dl",
        "dt",
        "figcaption",
        "figure",
        "hr",
        "li",
        "menu",
        "ol",
        "p",
        "pre",
        "ul",
        // Inline text semantics
        "a",
        "abbr",
        "b",
        "bdi",
        "bdo",
        "br",
        "cite",
        "code",
        "data",
        "dfn",
        "em",
        "i",
        "kbd",
        "mark",
        "q",
        "rb",
        "rp",
        "rt",
        "rtc",
        "ruby",
        "s",
        "samp",
        "small",
        "span",
        "strong",
        "sub",
        "sup",
        "time",
        "u",
        "var",
        "wbr",
        // Table content
        "caption",
        "col",
        "colgroup",
        "table",
        "tbody",
        "td",
        "tfoot",
        "th",
        "thead",
        "tr"
      ],
      // Tags that cannot be boolean
      nonBooleanAttributes: [
        "abbr",
        "accept",
        "accept-charset",
        "accesskey",
        "action",
        "allow",
        "alt",
        "as",
        "autocapitalize",
        "autocomplete",
        "blocking",
        "charset",
        "cite",
        "class",
        "color",
        "cols",
        "colspan",
        "content",
        "contenteditable",
        "coords",
        "crossorigin",
        "data",
        "datetime",
        "decoding",
        "dir",
        "dirname",
        "download",
        "draggable",
        "enctype",
        "enterkeyhint",
        "fetchpriority",
        "for",
        "form",
        "formaction",
        "formenctype",
        "formmethod",
        "formtarget",
        "headers",
        "height",
        "hidden",
        "high",
        "href",
        "hreflang",
        "http-equiv",
        "id",
        "imagesizes",
        "imagesrcset",
        "inputmode",
        "integrity",
        "is",
        "itemid",
        "itemprop",
        "itemref",
        "itemtype",
        "kind",
        "label",
        "lang",
        "list",
        "loading",
        "low",
        "max",
        "maxlength",
        "media",
        "method",
        "min",
        "minlength",
        "name",
        "nonce",
        "optimum",
        "pattern",
        "ping",
        "placeholder",
        "popover",
        "popovertarget",
        "popovertargetaction",
        "poster",
        "preload",
        "referrerpolicy",
        "rel",
        "rows",
        "rowspan",
        "sandbox",
        "scope",
        "shape",
        "size",
        "sizes",
        "slot",
        "span",
        "spellcheck",
        "src",
        "srcdoc",
        "srclang",
        "srcset",
        "start",
        "step",
        "style",
        "tabindex",
        "target",
        "title",
        "translate",
        "type",
        "usemap",
        "value",
        "width",
        "wrap",
        // Event handlers
        "onauxclick",
        "onafterprint",
        "onbeforematch",
        "onbeforeprint",
        "onbeforeunload",
        "onbeforetoggle",
        "onblur",
        "oncancel",
        "oncanplay",
        "oncanplaythrough",
        "onchange",
        "onclick",
        "onclose",
        "oncontextlost",
        "oncontextmenu",
        "oncontextrestored",
        "oncopy",
        "oncuechange",
        "oncut",
        "ondblclick",
        "ondrag",
        "ondragend",
        "ondragenter",
        "ondragleave",
        "ondragover",
        "ondragstart",
        "ondrop",
        "ondurationchange",
        "onemptied",
        "onended",
        "onerror",
        "onfocus",
        "onformdata",
        "onhashchange",
        "oninput",
        "oninvalid",
        "onkeydown",
        "onkeypress",
        "onkeyup",
        "onlanguagechange",
        "onload",
        "onloadeddata",
        "onloadedmetadata",
        "onloadstart",
        "onmessage",
        "onmessageerror",
        "onmousedown",
        "onmouseenter",
        "onmouseleave",
        "onmousemove",
        "onmouseout",
        "onmouseover",
        "onmouseup",
        "onoffline",
        "ononline",
        "onpagehide",
        "onpageshow",
        "onpaste",
        "onpause",
        "onplay",
        "onplaying",
        "onpopstate",
        "onprogress",
        "onratechange",
        "onreset",
        "onresize",
        "onrejectionhandled",
        "onscroll",
        "onscrollend",
        "onsecuritypolicyviolation",
        "onseeked",
        "onseeking",
        "onselect",
        "onslotchange",
        "onstalled",
        "onstorage",
        "onsubmit",
        "onsuspend",
        "ontimeupdate",
        "ontoggle",
        "onunhandledrejection",
        "onunload",
        "onvolumechange",
        "onwaiting",
        "onwheel"
      ],
      disallowedTagsMode: "discard",
      allowedAttributes: {
        a: ["href", "name", "target"],
        // We don't currently allow img itself by default, but
        // these attributes would make sense if we did.
        img: ["src", "srcset", "alt", "title", "width", "height", "loading"]
      },
      allowedEmptyAttributes: [
        "alt"
      ],
      // Lots of these won't come up by default because we don't allow them
      selfClosing: ["img", "br", "hr", "area", "base", "basefont", "input", "link", "meta", "col"],
      // URL schemes we permit
      allowedSchemes: ["http", "https", "ftp", "mailto", "tel"],
      allowedSchemesByTag: {},
      allowedSchemesAppliedToAttributes: [
        "href",
        "src",
        "cite",
        "action",
        "formaction",
        "data",
        "xlink:href",
        "poster",
        "background",
        "ping",
        "longdesc",
        "usemap",
        "codebase",
        "classid",
        "archive",
        "profile",
        "manifest",
        "itemid",
        "dynsrc",
        "lowsrc"
      ],
      allowProtocolRelative: true,
      enforceHtmlBoundary: false,
      parseStyleAttributes: true,
      preserveEscapedAttributes: false
    };
    sanitizeHtml2.simpleTransform = function(newTagName, newAttribs, merge) {
      merge = merge === void 0 ? true : merge;
      newAttribs = newAttribs || {};
      return function(tagName, attribs) {
        let attrib;
        if (merge) {
          for (attrib in newAttribs) {
            attribs[attrib] = newAttribs[attrib];
          }
        } else {
          attribs = newAttribs;
        }
        return {
          tagName: newTagName,
          attribs
        };
      };
    };
  }
});

// node_modules/postgres/src/query.js
function cachedError(xs) {
  if (originCache.has(xs))
    return originCache.get(xs);
  const x = Error.stackTraceLimit;
  Error.stackTraceLimit = 4;
  originCache.set(xs, new Error());
  Error.stackTraceLimit = x;
  return originCache.get(xs);
}
var originCache, originStackCache, originError, CLOSE, Query;
var init_query = __esm({
  "node_modules/postgres/src/query.js"() {
    originCache = /* @__PURE__ */ new Map();
    originStackCache = /* @__PURE__ */ new Map();
    originError = /* @__PURE__ */ Symbol("OriginError");
    CLOSE = {};
    Query = class extends Promise {
      constructor(strings, args, handler, canceller, options = {}) {
        let resolve, reject;
        super((a, b2) => {
          resolve = a;
          reject = b2;
        });
        this.tagged = Array.isArray(strings.raw);
        this.strings = strings;
        this.args = args;
        this.handler = handler;
        this.canceller = canceller;
        this.options = options;
        this.state = null;
        this.statement = null;
        this.resolve = (x) => (this.active = false, resolve(x));
        this.reject = (x) => (this.active = false, reject(x));
        this.active = false;
        this.cancelled = null;
        this.executed = false;
        this.signature = "";
        this[originError] = this.handler.debug ? new Error() : this.tagged && cachedError(this.strings);
      }
      get origin() {
        return (this.handler.debug ? this[originError].stack : this.tagged && originStackCache.has(this.strings) ? originStackCache.get(this.strings) : originStackCache.set(this.strings, this[originError].stack).get(this.strings)) || "";
      }
      static get [Symbol.species]() {
        return Promise;
      }
      cancel() {
        return this.canceller && (this.canceller(this), this.canceller = null);
      }
      simple() {
        this.options.simple = true;
        this.options.prepare = false;
        return this;
      }
      async readable() {
        this.simple();
        this.streaming = true;
        return this;
      }
      async writable() {
        this.simple();
        this.streaming = true;
        return this;
      }
      cursor(rows = 1, fn) {
        this.options.simple = false;
        if (typeof rows === "function") {
          fn = rows;
          rows = 1;
        }
        this.cursorRows = rows;
        if (typeof fn === "function")
          return this.cursorFn = fn, this;
        let prev;
        return {
          [Symbol.asyncIterator]: () => ({
            next: () => {
              if (this.executed && !this.active)
                return { done: true };
              prev && prev();
              const promise = new Promise((resolve, reject) => {
                this.cursorFn = (value) => {
                  resolve({ value, done: false });
                  return new Promise((r) => prev = r);
                };
                this.resolve = () => (this.active = false, resolve({ done: true }));
                this.reject = (x) => (this.active = false, reject(x));
              });
              this.execute();
              return promise;
            },
            return() {
              prev && prev(CLOSE);
              return { done: true };
            }
          })
        };
      }
      describe() {
        this.options.simple = false;
        this.onlyDescribe = this.options.prepare = true;
        return this;
      }
      stream() {
        throw new Error(".stream has been renamed to .forEach");
      }
      forEach(fn) {
        this.forEachFn = fn;
        this.handle();
        return this;
      }
      raw() {
        this.isRaw = true;
        return this;
      }
      values() {
        this.isRaw = "values";
        return this;
      }
      async handle() {
        !this.executed && (this.executed = true) && await 1 && this.handler(this);
      }
      execute() {
        this.handle();
        return this;
      }
      then() {
        this.handle();
        return super.then.apply(this, arguments);
      }
      catch() {
        this.handle();
        return super.catch.apply(this, arguments);
      }
      finally() {
        this.handle();
        return super.finally.apply(this, arguments);
      }
    };
  }
});

// node_modules/postgres/src/errors.js
function connection(x, options, socket) {
  const { host, port } = socket || options;
  const error = Object.assign(
    new Error("write " + x + " " + (options.path || host + ":" + port)),
    {
      code: x,
      errno: x,
      address: options.path || host
    },
    options.path ? {} : { port }
  );
  Error.captureStackTrace(error, connection);
  return error;
}
function postgres(x) {
  const error = new PostgresError(x);
  Error.captureStackTrace(error, postgres);
  return error;
}
function generic(code, message) {
  const error = Object.assign(new Error(code + ": " + message), { code });
  Error.captureStackTrace(error, generic);
  return error;
}
function notSupported(x) {
  const error = Object.assign(
    new Error(x + " (B) is not supported"),
    {
      code: "MESSAGE_NOT_SUPPORTED",
      name: x
    }
  );
  Error.captureStackTrace(error, notSupported);
  return error;
}
var PostgresError, Errors;
var init_errors = __esm({
  "node_modules/postgres/src/errors.js"() {
    PostgresError = class extends Error {
      constructor(x) {
        super(x.message);
        this.name = this.constructor.name;
        Object.assign(this, x);
      }
    };
    Errors = {
      connection,
      postgres,
      generic,
      notSupported
    };
  }
});

// node_modules/postgres/src/types.js
function handleValue(x, parameters, types2, options) {
  let value = x instanceof Parameter ? x.value : x;
  if (value === void 0) {
    x instanceof Parameter ? x.value = options.transform.undefined : value = x = options.transform.undefined;
    if (value === void 0)
      throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
  }
  return "$" + types2.push(
    x instanceof Parameter ? (parameters.push(x.value), x.array ? x.array[x.type || inferType(x.value)] || x.type || firstIsString(x.value) : x.type) : (parameters.push(x), inferType(x))
  );
}
function stringify(q, string, value, parameters, types2, options) {
  for (let i = 1; i < q.strings.length; i++) {
    string += stringifyValue(string, value, parameters, types2, options) + q.strings[i];
    value = q.args[i];
  }
  return string;
}
function stringifyValue(string, value, parameters, types2, o) {
  return value instanceof Builder ? value.build(string, parameters, types2, o) : value instanceof Query ? fragment(value, parameters, types2, o) : value instanceof Identifier ? value.value : value && value[0] instanceof Query ? value.reduce((acc, x) => acc + " " + fragment(x, parameters, types2, o), "") : handleValue(value, parameters, types2, o);
}
function fragment(q, parameters, types2, options) {
  q.fragment = true;
  return stringify(q, q.strings[0], q.args[0], parameters, types2, options);
}
function valuesBuilder(first, parameters, types2, columns, options) {
  return first.map(
    (row) => "(" + columns.map(
      (column) => stringifyValue("values", row[column], parameters, types2, options)
    ).join(",") + ")"
  ).join(",");
}
function values(first, rest, parameters, types2, options) {
  const multi = Array.isArray(first[0]);
  const columns = rest.length ? rest.flat() : Object.keys(multi ? first[0] : first);
  return valuesBuilder(multi ? first : [first], parameters, types2, columns, options);
}
function select(first, rest, parameters, types2, options) {
  typeof first === "string" && (first = [first].concat(rest));
  if (Array.isArray(first))
    return escapeIdentifiers(first, options);
  let value;
  const columns = rest.length ? rest.flat() : Object.keys(first);
  return columns.map((x) => {
    value = first[x];
    return (value instanceof Query ? fragment(value, parameters, types2, options) : value instanceof Identifier ? value.value : handleValue(value, parameters, types2, options)) + " as " + escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x);
  }).join(",");
}
function notTagged() {
  throw Errors.generic("NOT_TAGGED_CALL", "Query not called as a tagged template literal");
}
function firstIsString(x) {
  if (Array.isArray(x))
    return firstIsString(x[0]);
  return typeof x === "string" ? 1009 : 0;
}
function typeHandlers(types2) {
  return Object.keys(types2).reduce((acc, k) => {
    types2[k].from && [].concat(types2[k].from).forEach((x) => acc.parsers[x] = types2[k].parse);
    if (types2[k].serialize) {
      acc.serializers[types2[k].to] = types2[k].serialize;
      types2[k].from && [].concat(types2[k].from).forEach((x) => acc.serializers[x] = types2[k].serialize);
    }
    return acc;
  }, { parsers: {}, serializers: {} });
}
function escapeIdentifiers(xs, { transform: { column } }) {
  return xs.map((x) => escapeIdentifier(column.to ? column.to(x) : x)).join(",");
}
function arrayEscape(x) {
  return x.replace(escapeBackslash, "\\\\").replace(escapeQuote, '\\"');
}
function arrayParserLoop(s, x, parser, typarray) {
  const xs = [];
  const delimiter = typarray === 1020 ? ";" : ",";
  for (; s.i < x.length; s.i++) {
    s.char = x[s.i];
    if (s.quoted) {
      if (s.char === "\\") {
        s.str += x[++s.i];
      } else if (s.char === '"') {
        xs.push(parser ? parser(s.str) : s.str);
        s.str = "";
        s.quoted = x[s.i + 1] === '"';
        s.last = s.i + 2;
      } else {
        s.str += s.char;
      }
    } else if (s.char === '"') {
      s.quoted = true;
    } else if (s.char === "{") {
      s.last = ++s.i;
      xs.push(arrayParserLoop(s, x, parser, typarray));
    } else if (s.char === "}") {
      s.quoted = false;
      s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
      break;
    } else if (s.char === delimiter && s.p !== "}" && s.p !== '"') {
      xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
    }
    s.p = s.char;
  }
  s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i + 1)) : x.slice(s.last, s.i + 1));
  return xs;
}
function createJsonTransform(fn) {
  return function jsonTransform(x, column) {
    return typeof x === "object" && x !== null && (column.type === 114 || column.type === 3802) ? Array.isArray(x) ? x.map((x2) => jsonTransform(x2, column)) : Object.entries(x).reduce((acc, [k, v]) => Object.assign(acc, { [fn(k)]: jsonTransform(v, column) }), {}) : x;
  };
}
var types, NotTagged, Identifier, Parameter, Builder, defaultHandlers, builders, serializers, parsers, mergeUserTypes, escapeIdentifier, inferType, escapeBackslash, escapeQuote, arraySerializer, arrayParserState, arrayParser, toCamel, toPascal, toKebab, fromCamel, fromPascal, fromKebab, camel, pascal, kebab;
var init_types = __esm({
  "node_modules/postgres/src/types.js"() {
    init_query();
    init_errors();
    types = {
      string: {
        to: 25,
        from: null,
        // defaults to string
        serialize: (x) => "" + x
      },
      number: {
        to: 0,
        from: [21, 23, 26, 700, 701],
        serialize: (x) => "" + x,
        parse: (x) => +x
      },
      json: {
        to: 114,
        from: [114, 3802],
        serialize: (x) => JSON.stringify(x),
        parse: (x) => JSON.parse(x)
      },
      boolean: {
        to: 16,
        from: 16,
        serialize: (x) => x === true ? "t" : "f",
        parse: (x) => x === "t"
      },
      date: {
        to: 1184,
        from: [1082, 1114, 1184],
        serialize: (x) => (x instanceof Date ? x : new Date(x)).toISOString(),
        parse: (x) => new Date(x)
      },
      bytea: {
        to: 17,
        from: 17,
        serialize: (x) => "\\x" + Buffer.from(x).toString("hex"),
        parse: (x) => Buffer.from(x.slice(2), "hex")
      }
    };
    NotTagged = class {
      then() {
        notTagged();
      }
      catch() {
        notTagged();
      }
      finally() {
        notTagged();
      }
    };
    Identifier = class extends NotTagged {
      constructor(value) {
        super();
        this.value = escapeIdentifier(value);
      }
    };
    Parameter = class extends NotTagged {
      constructor(value, type, array) {
        super();
        this.value = value;
        this.type = type;
        this.array = array;
      }
    };
    Builder = class extends NotTagged {
      constructor(first, rest) {
        super();
        this.first = first;
        this.rest = rest;
      }
      build(before, parameters, types2, options) {
        const keyword = builders.map(([x, fn]) => ({ fn, i: before.search(x) })).sort((a, b2) => a.i - b2.i).pop();
        return keyword.i === -1 ? escapeIdentifiers(this.first, options) : keyword.fn(this.first, this.rest, parameters, types2, options);
      }
    };
    defaultHandlers = typeHandlers(types);
    builders = Object.entries({
      values,
      in: (...xs) => {
        const x = values(...xs);
        return x === "()" ? "(null)" : x;
      },
      select,
      as: select,
      returning: select,
      "\\(": select,
      update(first, rest, parameters, types2, options) {
        return (rest.length ? rest.flat() : Object.keys(first)).map(
          (x) => escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x) + "=" + stringifyValue("values", first[x], parameters, types2, options)
        );
      },
      insert(first, rest, parameters, types2, options) {
        const columns = rest.length ? rest.flat() : Object.keys(Array.isArray(first) ? first[0] : first);
        return "(" + escapeIdentifiers(columns, options) + ")values" + valuesBuilder(Array.isArray(first) ? first : [first], parameters, types2, columns, options);
      }
    }).map(([x, fn]) => [new RegExp("((?:^|[\\s(])" + x + "(?:$|[\\s(]))(?![\\s\\S]*\\1)", "i"), fn]);
    serializers = defaultHandlers.serializers;
    parsers = defaultHandlers.parsers;
    mergeUserTypes = function(types2) {
      const user = typeHandlers(types2 || {});
      return {
        serializers: Object.assign({}, serializers, user.serializers),
        parsers: Object.assign({}, parsers, user.parsers)
      };
    };
    escapeIdentifier = function escape2(str2) {
      return '"' + str2.replace(/"/g, '""').replace(/\./g, '"."') + '"';
    };
    inferType = function inferType2(x) {
      return x instanceof Parameter ? x.type : x instanceof Date ? 1184 : x instanceof Uint8Array ? 17 : x === true || x === false ? 16 : typeof x === "bigint" ? 20 : Array.isArray(x) ? inferType2(x[0]) : 0;
    };
    escapeBackslash = /\\/g;
    escapeQuote = /"/g;
    arraySerializer = function arraySerializer2(xs, serializer, options, typarray) {
      if (Array.isArray(xs) === false)
        return xs;
      if (!xs.length)
        return "{}";
      const first = xs[0];
      const delimiter = typarray === 1020 ? ";" : ",";
      if (Array.isArray(first) && !first.type)
        return "{" + xs.map((x) => arraySerializer2(x, serializer, options, typarray)).join(delimiter) + "}";
      return "{" + xs.map((x) => {
        if (x === void 0) {
          x = options.transform.undefined;
          if (x === void 0)
            throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
        }
        return x === null ? "null" : '"' + arrayEscape(serializer ? serializer(x.type ? x.value : x) : "" + x) + '"';
      }).join(delimiter) + "}";
    };
    arrayParserState = {
      i: 0,
      char: null,
      str: "",
      quoted: false,
      last: 0
    };
    arrayParser = function arrayParser2(x, parser, typarray) {
      arrayParserState.i = arrayParserState.last = 0;
      return arrayParserLoop(arrayParserState, x, parser, typarray);
    };
    toCamel = (x) => {
      let str2 = x[0];
      for (let i = 1; i < x.length; i++)
        str2 += x[i] === "_" ? x[++i].toUpperCase() : x[i];
      return str2;
    };
    toPascal = (x) => {
      let str2 = x[0].toUpperCase();
      for (let i = 1; i < x.length; i++)
        str2 += x[i] === "_" ? x[++i].toUpperCase() : x[i];
      return str2;
    };
    toKebab = (x) => x.replace(/_/g, "-");
    fromCamel = (x) => x.replace(/([A-Z])/g, "_$1").toLowerCase();
    fromPascal = (x) => (x.slice(0, 1) + x.slice(1).replace(/([A-Z])/g, "_$1")).toLowerCase();
    fromKebab = (x) => x.replace(/-/g, "_");
    toCamel.column = { from: toCamel };
    toCamel.value = { from: createJsonTransform(toCamel) };
    fromCamel.column = { to: fromCamel };
    camel = { ...toCamel };
    camel.column.to = fromCamel;
    toPascal.column = { from: toPascal };
    toPascal.value = { from: createJsonTransform(toPascal) };
    fromPascal.column = { to: fromPascal };
    pascal = { ...toPascal };
    pascal.column.to = fromPascal;
    toKebab.column = { from: toKebab };
    toKebab.value = { from: createJsonTransform(toKebab) };
    fromKebab.column = { to: fromKebab };
    kebab = { ...toKebab };
    kebab.column.to = fromKebab;
  }
});

// node_modules/postgres/src/result.js
var Result;
var init_result = __esm({
  "node_modules/postgres/src/result.js"() {
    Result = class extends Array {
      constructor() {
        super();
        Object.defineProperties(this, {
          count: { value: null, writable: true },
          state: { value: null, writable: true },
          command: { value: null, writable: true },
          columns: { value: null, writable: true },
          statement: { value: null, writable: true }
        });
      }
      static get [Symbol.species]() {
        return Array;
      }
    };
  }
});

// node_modules/postgres/src/queue.js
function Queue(initial = []) {
  let xs = initial.slice();
  let index = 0;
  return {
    get length() {
      return xs.length - index;
    },
    remove: (x) => {
      const index2 = xs.indexOf(x);
      return index2 === -1 ? null : (xs.splice(index2, 1), x);
    },
    push: (x) => (xs.push(x), x),
    shift: () => {
      const out = xs[index++];
      if (index === xs.length) {
        index = 0;
        xs = [];
      } else {
        xs[index - 1] = void 0;
      }
      return out;
    }
  };
}
var queue_default;
var init_queue = __esm({
  "node_modules/postgres/src/queue.js"() {
    queue_default = Queue;
  }
});

// node_modules/postgres/src/bytes.js
function fit(x) {
  if (buffer.length - b.i < x) {
    const prev = buffer, length = prev.length;
    buffer = Buffer.allocUnsafe(length + (length >> 1) + x);
    prev.copy(buffer);
  }
}
function reset() {
  b.i = 0;
  return b;
}
var size, buffer, messages, b, bytes_default;
var init_bytes = __esm({
  "node_modules/postgres/src/bytes.js"() {
    size = 256;
    buffer = Buffer.allocUnsafe(size);
    messages = "BCcDdEFfHPpQSX".split("").reduce((acc, x) => {
      const v = x.charCodeAt(0);
      acc[x] = () => {
        buffer[0] = v;
        b.i = 5;
        return b;
      };
      return acc;
    }, {});
    b = Object.assign(reset, messages, {
      N: String.fromCharCode(0),
      i: 0,
      inc(x) {
        b.i += x;
        return b;
      },
      str(x) {
        const length = Buffer.byteLength(x);
        fit(length);
        b.i += buffer.write(x, b.i, length, "utf8");
        return b;
      },
      i16(x) {
        fit(2);
        buffer.writeUInt16BE(x, b.i);
        b.i += 2;
        return b;
      },
      i32(x, i) {
        if (i || i === 0) {
          buffer.writeUInt32BE(x, i);
          return b;
        }
        fit(4);
        buffer.writeUInt32BE(x, b.i);
        b.i += 4;
        return b;
      },
      z(x) {
        fit(x);
        buffer.fill(0, b.i, b.i + x);
        b.i += x;
        return b;
      },
      raw(x) {
        buffer = Buffer.concat([buffer.subarray(0, b.i), x]);
        b.i = buffer.length;
        return b;
      },
      end(at = 1) {
        buffer.writeUInt32BE(b.i - at, at);
        const out = buffer.subarray(0, b.i);
        b.i = 0;
        buffer = Buffer.allocUnsafe(size);
        return out;
      }
    });
    bytes_default = b;
  }
});

// node_modules/postgres/src/connection.js
import net from "net";
import tls from "tls";
import crypto2 from "crypto";
import Stream from "stream";
import { performance } from "perf_hooks";
function Connection(options, queues = {}, { onopen = noop, onend = noop, onclose = noop } = {}) {
  const {
    sslnegotiation,
    ssl,
    max,
    user,
    host,
    port,
    database,
    parsers: parsers2,
    transform,
    onnotice,
    onnotify,
    onparameter,
    max_pipeline,
    keep_alive,
    backoff: backoff2,
    target_session_attrs
  } = options;
  const sent = queue_default(), id = uid++, backend = { pid: null, secret: null }, idleTimer = timer(end, options.idle_timeout), lifeTimer = timer(end, options.max_lifetime), connectTimer = timer(connectTimedOut, options.connect_timeout);
  let socket = null, cancelMessage, errorResponse = null, result = new Result(), incoming = Buffer.alloc(0), needsTypes = options.fetch_types, backendParameters = {}, statements = {}, statementId = Math.random().toString(36).slice(2), statementCount = 1, closedTime = 0, remaining = 0, hostIndex = 0, retries = 0, length = 0, delay = 0, rows = 0, serverSignature = null, nextWriteTimer = null, terminated = false, incomings = null, results = null, initial = null, ending = null, stream = null, chunk = null, ended = null, nonce = null, query = null, final = null;
  const connection2 = {
    queue: queues.closed,
    idleTimer,
    connect(query2) {
      initial = query2;
      reconnect();
    },
    terminate,
    execute,
    cancel,
    end,
    count: 0,
    id
  };
  queues.closed && queues.closed.push(connection2);
  return connection2;
  async function createSocket() {
    let x;
    try {
      x = options.socket ? await Promise.resolve(options.socket(options)) : new net.Socket();
    } catch (e) {
      error(e);
      return;
    }
    x.on("error", error);
    x.on("close", closed);
    x.on("drain", drain);
    return x;
  }
  async function cancel({ pid, secret }, resolve, reject) {
    try {
      cancelMessage = bytes_default().i32(16).i32(80877102).i32(pid).i32(secret).end(16);
      await connect();
      socket.once("error", reject);
      socket.once("close", resolve);
    } catch (error2) {
      reject(error2);
    }
  }
  function execute(q) {
    if (terminated)
      return queryError(q, Errors.connection("CONNECTION_DESTROYED", options));
    if (stream)
      return queryError(q, Errors.generic("COPY_IN_PROGRESS", "You cannot execute queries during copy"));
    if (q.cancelled)
      return;
    try {
      q.state = backend;
      query ? sent.push(q) : (query = q, query.active = true);
      build(q);
      return write(toBuffer(q)) && !q.describeFirst && !q.cursorFn && sent.length < max_pipeline && (!q.options.onexecute || q.options.onexecute(connection2));
    } catch (error2) {
      sent.length === 0 && write(Sync);
      errored(error2);
      return true;
    }
  }
  function toBuffer(q) {
    if (q.parameters.length >= 65534)
      throw Errors.generic("MAX_PARAMETERS_EXCEEDED", "Max number of parameters (65534) exceeded");
    return q.options.simple ? bytes_default().Q().str(q.statement.string + bytes_default.N).end() : q.describeFirst ? Buffer.concat([describe(q), Flush]) : q.prepare ? q.prepared ? prepared(q) : Buffer.concat([describe(q), prepared(q)]) : unnamed(q);
  }
  function describe(q) {
    return Buffer.concat([
      Parse(q.statement.string, q.parameters, q.statement.types, q.statement.name),
      Describe("S", q.statement.name)
    ]);
  }
  function prepared(q) {
    return Buffer.concat([
      Bind(q.parameters, q.statement.types, q.statement.name, q.cursorName),
      q.cursorFn ? Execute("", q.cursorRows) : ExecuteUnnamed
    ]);
  }
  function unnamed(q) {
    return Buffer.concat([
      Parse(q.statement.string, q.parameters, q.statement.types),
      DescribeUnnamed,
      prepared(q)
    ]);
  }
  function build(q) {
    const parameters = [], types2 = [];
    const string = stringify(q, q.strings[0], q.args[0], parameters, types2, options);
    !q.tagged && q.args.forEach((x) => handleValue(x, parameters, types2, options));
    q.prepare = options.prepare && ("prepare" in q.options ? q.options.prepare : true);
    q.string = string;
    q.signature = q.prepare && types2 + string;
    q.onlyDescribe && delete statements[q.signature];
    q.parameters = q.parameters || parameters;
    q.prepared = q.prepare && q.signature in statements;
    q.describeFirst = q.onlyDescribe || parameters.length && !q.prepared;
    q.statement = q.prepared ? statements[q.signature] : { string, types: types2, name: q.prepare ? statementId + statementCount++ : "" };
    typeof options.debug === "function" && options.debug(id, string, parameters, types2);
  }
  function write(x, fn) {
    chunk = chunk ? Buffer.concat([chunk, x]) : Buffer.from(x);
    if (fn || chunk.length >= 1024)
      return nextWrite(fn);
    nextWriteTimer === null && (nextWriteTimer = setImmediate(nextWrite));
    return true;
  }
  function nextWrite(fn) {
    const x = socket.write(chunk, fn);
    nextWriteTimer !== null && clearImmediate(nextWriteTimer);
    chunk = nextWriteTimer = null;
    return x;
  }
  function connectTimedOut() {
    errored(Errors.connection("CONNECT_TIMEOUT", options, socket));
    socket.destroy();
  }
  async function secure() {
    if (sslnegotiation !== "direct") {
      write(SSLRequest);
      const canSSL = await new Promise((r) => socket.once("data", (x) => r(x[0] === 83)));
      if (!canSSL && ssl === "prefer")
        return connected();
    }
    const options2 = {
      socket,
      servername: net.isIP(socket.host) ? void 0 : socket.host
    };
    if (sslnegotiation === "direct")
      options2.ALPNProtocols = ["postgresql"];
    if (ssl === "require" || ssl === "allow" || ssl === "prefer")
      options2.rejectUnauthorized = false;
    else if (typeof ssl === "object")
      Object.assign(options2, ssl);
    socket.removeAllListeners();
    socket = tls.connect(options2);
    socket.on("secureConnect", connected);
    socket.on("error", error);
    socket.on("close", closed);
    socket.on("drain", drain);
  }
  function drain() {
    !query && onopen(connection2);
  }
  function data(x) {
    if (incomings) {
      incomings.push(x);
      remaining -= x.length;
      if (remaining > 0)
        return;
    }
    incoming = incomings ? Buffer.concat(incomings, length - remaining) : incoming.length === 0 ? x : Buffer.concat([incoming, x], incoming.length + x.length);
    while (incoming.length > 4) {
      length = incoming.readUInt32BE(1);
      if (length >= incoming.length) {
        remaining = length - incoming.length;
        incomings = [incoming];
        break;
      }
      try {
        handle2(incoming.subarray(0, length + 1));
      } catch (e) {
        query && (query.cursorFn || query.describeFirst) && write(Sync);
        errored(e);
      }
      incoming = incoming.subarray(length + 1);
      remaining = 0;
      incomings = null;
    }
  }
  async function connect() {
    terminated = false;
    backendParameters = {};
    socket || (socket = await createSocket());
    if (!socket)
      return;
    connectTimer.start();
    if (options.socket)
      return ssl ? secure() : connected();
    socket.on("connect", ssl ? secure : connected);
    if (options.path)
      return socket.connect(options.path);
    socket.ssl = ssl;
    socket.connect(port[hostIndex], host[hostIndex]);
    socket.host = host[hostIndex];
    socket.port = port[hostIndex];
    hostIndex = (hostIndex + 1) % port.length;
  }
  function reconnect() {
    setTimeout(connect, closedTime ? Math.max(0, closedTime + delay - performance.now()) : 0);
  }
  function connected() {
    try {
      statements = {};
      needsTypes = options.fetch_types;
      statementId = Math.random().toString(36).slice(2);
      statementCount = 1;
      lifeTimer.start();
      socket.on("data", data);
      keep_alive && socket.setKeepAlive && socket.setKeepAlive(true, 1e3 * keep_alive);
      const s = StartupMessage();
      write(s);
    } catch (err) {
      error(err);
    }
  }
  function error(err) {
    if (connection2.queue === queues.connecting && options.host[retries + 1])
      return;
    errored(err);
    while (sent.length)
      queryError(sent.shift(), err);
  }
  function errored(err) {
    stream && (stream.destroy(err), stream = null);
    query && queryError(query, err);
    initial && (queryError(initial, err), initial = null);
  }
  function queryError(query2, err) {
    if (query2.reserve)
      return query2.reject(err);
    if (!err || typeof err !== "object")
      err = new Error(err);
    "query" in err || "parameters" in err || Object.defineProperties(err, {
      stack: { value: err.stack + query2.origin.replace(/.*\n/, "\n"), enumerable: options.debug },
      query: { value: query2.string, enumerable: options.debug },
      parameters: { value: query2.parameters, enumerable: options.debug },
      args: { value: query2.args, enumerable: options.debug },
      types: { value: query2.statement && query2.statement.types, enumerable: options.debug }
    });
    query2.reject(err);
  }
  function end() {
    return ending || (!connection2.reserved && onend(connection2), !connection2.reserved && !initial && !query && sent.length === 0 ? (terminate(), new Promise((r) => socket && socket.readyState !== "closed" ? socket.once("close", r) : r())) : ending = new Promise((r) => ended = r));
  }
  function terminate() {
    terminated = true;
    if (stream || query || initial || sent.length)
      error(Errors.connection("CONNECTION_DESTROYED", options));
    clearImmediate(nextWriteTimer);
    if (socket) {
      socket.removeListener("data", data);
      socket.removeListener("connect", connected);
      socket.readyState === "open" && socket.end(bytes_default().X().end());
    }
    ended && (ended(), ending = ended = null);
  }
  async function closed(hadError) {
    incoming = Buffer.alloc(0);
    remaining = 0;
    incomings = null;
    clearImmediate(nextWriteTimer);
    socket.removeListener("data", data);
    socket.removeListener("connect", connected);
    idleTimer.cancel();
    lifeTimer.cancel();
    connectTimer.cancel();
    socket.removeAllListeners();
    socket = null;
    if (initial)
      return reconnect();
    !hadError && (query || sent.length) && error(Errors.connection("CONNECTION_CLOSED", options, socket));
    closedTime = performance.now();
    hadError && options.shared.retries++;
    delay = (typeof backoff2 === "function" ? backoff2(options.shared.retries) : backoff2) * 1e3;
    onclose(connection2, Errors.connection("CONNECTION_CLOSED", options, socket));
  }
  function handle2(xs, x = xs[0]) {
    (x === 68 ? DataRow : (
      // D
      x === 100 ? CopyData : (
        // d
        x === 65 ? NotificationResponse : (
          // A
          x === 83 ? ParameterStatus : (
            // S
            x === 90 ? ReadyForQuery : (
              // Z
              x === 67 ? CommandComplete : (
                // C
                x === 50 ? BindComplete : (
                  // 2
                  x === 49 ? ParseComplete : (
                    // 1
                    x === 116 ? ParameterDescription : (
                      // t
                      x === 84 ? RowDescription : (
                        // T
                        x === 82 ? Authentication : (
                          // R
                          x === 110 ? NoData : (
                            // n
                            x === 75 ? BackendKeyData : (
                              // K
                              x === 69 ? ErrorResponse : (
                                // E
                                x === 115 ? PortalSuspended : (
                                  // s
                                  x === 51 ? CloseComplete : (
                                    // 3
                                    x === 71 ? CopyInResponse : (
                                      // G
                                      x === 78 ? NoticeResponse : (
                                        // N
                                        x === 72 ? CopyOutResponse : (
                                          // H
                                          x === 99 ? CopyDone : (
                                            // c
                                            x === 73 ? EmptyQueryResponse : (
                                              // I
                                              x === 86 ? FunctionCallResponse : (
                                                // V
                                                x === 118 ? NegotiateProtocolVersion : (
                                                  // v
                                                  x === 87 ? CopyBothResponse : (
                                                    // W
                                                    /* c8 ignore next */
                                                    UnknownMessage
                                                  )
                                                )
                                              )
                                            )
                                          )
                                        )
                                      )
                                    )
                                  )
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    ))(xs);
  }
  function DataRow(x) {
    let index = 7;
    let length2;
    let column;
    let value;
    const row = query.isRaw ? new Array(query.statement.columns.length) : {};
    for (let i = 0; i < query.statement.columns.length; i++) {
      column = query.statement.columns[i];
      length2 = x.readInt32BE(index);
      index += 4;
      value = length2 === -1 ? null : query.isRaw === true ? x.subarray(index, index += length2) : column.parser === void 0 ? x.toString("utf8", index, index += length2) : column.parser.array === true ? column.parser(x.toString("utf8", index + 1, index += length2)) : column.parser(x.toString("utf8", index, index += length2));
      query.isRaw ? row[i] = query.isRaw === true ? value : transform.value.from ? transform.value.from(value, column) : value : row[column.name] = transform.value.from ? transform.value.from(value, column) : value;
    }
    query.forEachFn ? query.forEachFn(transform.row.from ? transform.row.from(row) : row, result) : result[rows++] = transform.row.from ? transform.row.from(row) : row;
  }
  function ParameterStatus(x) {
    const [k, v] = x.toString("utf8", 5, x.length - 1).split(bytes_default.N);
    backendParameters[k] = v;
    if (options.parameters[k] !== v) {
      options.parameters[k] = v;
      onparameter && onparameter(k, v);
    }
  }
  function ReadyForQuery(x) {
    if (query) {
      if (errorResponse) {
        query.retried ? errored(query.retried) : query.prepared && retryRoutines.has(errorResponse.routine) ? retry(query, errorResponse) : errored(errorResponse);
      } else {
        query.resolve(results || result);
      }
    } else if (errorResponse) {
      errored(errorResponse);
    }
    query = results = errorResponse = null;
    result = new Result();
    connectTimer.cancel();
    if (initial) {
      if (target_session_attrs) {
        if (!backendParameters.in_hot_standby || !backendParameters.default_transaction_read_only)
          return fetchState();
        else if (tryNext(target_session_attrs, backendParameters))
          return terminate();
      }
      if (needsTypes) {
        initial.reserve && (initial = null);
        return fetchArrayTypes();
      }
      initial && !initial.reserve && execute(initial);
      options.shared.retries = retries = 0;
      initial = null;
      return;
    }
    while (sent.length && (query = sent.shift()) && (query.active = true, query.cancelled))
      Connection(options).cancel(query.state, query.cancelled.resolve, query.cancelled.reject);
    if (query)
      return;
    connection2.reserved ? !connection2.reserved.release && x[5] === 73 ? ending ? terminate() : (connection2.reserved = null, onopen(connection2)) : connection2.reserved() : ending ? terminate() : onopen(connection2);
  }
  function CommandComplete(x) {
    rows = 0;
    for (let i = x.length - 1; i > 0; i--) {
      if (x[i] === 32 && x[i + 1] < 58 && result.count === null)
        result.count = +x.toString("utf8", i + 1, x.length - 1);
      if (x[i - 1] >= 65) {
        result.command = x.toString("utf8", 5, i);
        result.state = backend;
        break;
      }
    }
    final && (final(), final = null);
    if (result.command === "BEGIN" && max !== 1 && !connection2.reserved)
      return errored(Errors.generic("UNSAFE_TRANSACTION", "Only use sql.begin, sql.reserved or max: 1"));
    if (query.options.simple)
      return BindComplete();
    if (query.cursorFn) {
      result.count && query.cursorFn(result);
      write(Sync);
    }
  }
  function ParseComplete() {
    query.parsing = false;
  }
  function BindComplete() {
    !result.statement && (result.statement = query.statement);
    result.columns = query.statement.columns;
  }
  function ParameterDescription(x) {
    const length2 = x.readUInt16BE(5);
    for (let i = 0; i < length2; ++i)
      !query.statement.types[i] && (query.statement.types[i] = x.readUInt32BE(7 + i * 4));
    query.prepare && (statements[query.signature] = query.statement);
    query.describeFirst && !query.onlyDescribe && (write(prepared(query)), query.describeFirst = false);
  }
  function RowDescription(x) {
    if (result.command) {
      results = results || [result];
      results.push(result = new Result());
      result.count = null;
      query.statement.columns = null;
    }
    const length2 = x.readUInt16BE(5);
    let index = 7;
    let start;
    query.statement.columns = Array(length2);
    for (let i = 0; i < length2; ++i) {
      start = index;
      while (x[index++] !== 0) ;
      const table = x.readUInt32BE(index);
      const number = x.readUInt16BE(index + 4);
      const type = x.readUInt32BE(index + 6);
      query.statement.columns[i] = {
        name: transform.column.from ? transform.column.from(x.toString("utf8", start, index - 1)) : x.toString("utf8", start, index - 1),
        parser: parsers2[type],
        table,
        number,
        type
      };
      index += 18;
    }
    result.statement = query.statement;
    if (query.onlyDescribe)
      return query.resolve(query.statement), write(Sync);
  }
  async function Authentication(x, type = x.readUInt32BE(5)) {
    (type === 3 ? AuthenticationCleartextPassword : type === 5 ? AuthenticationMD5Password : type === 10 ? SASL : type === 11 ? SASLContinue : type === 12 ? SASLFinal : type !== 0 ? UnknownAuth : noop)(x, type);
  }
  async function AuthenticationCleartextPassword() {
    const payload = await Pass();
    write(
      bytes_default().p().str(payload).z(1).end()
    );
  }
  async function AuthenticationMD5Password(x) {
    const payload = "md5" + await md5(
      Buffer.concat([
        Buffer.from(await md5(await Pass() + user)),
        x.subarray(9)
      ])
    );
    write(
      bytes_default().p().str(payload).z(1).end()
    );
  }
  async function SASL() {
    nonce = (await crypto2.randomBytes(18)).toString("base64");
    bytes_default().p().str("SCRAM-SHA-256" + bytes_default.N);
    const i = bytes_default.i;
    write(bytes_default.inc(4).str("n,,n=*,r=" + nonce).i32(bytes_default.i - i - 4, i).end());
  }
  async function SASLContinue(x) {
    const res = x.toString("utf8", 9).split(",").reduce((acc, x2) => (acc[x2[0]] = x2.slice(2), acc), {});
    const saltedPassword = await crypto2.pbkdf2Sync(
      await Pass(),
      Buffer.from(res.s, "base64"),
      parseInt(res.i),
      32,
      "sha256"
    );
    const clientKey = await hmac(saltedPassword, "Client Key");
    const auth = "n=*,r=" + nonce + ",r=" + res.r + ",s=" + res.s + ",i=" + res.i + ",c=biws,r=" + res.r;
    serverSignature = (await hmac(await hmac(saltedPassword, "Server Key"), auth)).toString("base64");
    const payload = "c=biws,r=" + res.r + ",p=" + xor(
      clientKey,
      Buffer.from(await hmac(await sha256(clientKey), auth))
    ).toString("base64");
    write(
      bytes_default().p().str(payload).end()
    );
  }
  function SASLFinal(x) {
    if (x.toString("utf8", 9).split(bytes_default.N, 1)[0].slice(2) === serverSignature)
      return;
    errored(Errors.generic("SASL_SIGNATURE_MISMATCH", "The server did not return the correct signature"));
    socket.destroy();
  }
  function Pass() {
    return Promise.resolve(
      typeof options.pass === "function" ? options.pass() : options.pass
    );
  }
  function NoData() {
    result.statement = query.statement;
    result.statement.columns = [];
    if (query.onlyDescribe)
      return query.resolve(query.statement), write(Sync);
  }
  function BackendKeyData(x) {
    backend.pid = x.readUInt32BE(5);
    backend.secret = x.readUInt32BE(9);
  }
  async function fetchArrayTypes() {
    needsTypes = false;
    const types2 = await new Query([`
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b on b.oid = a.typelem
      where a.typcategory = 'A'
      group by b.oid, b.typarray
      order by b.oid
    `], [], execute);
    types2.forEach(({ oid, typarray }) => addArrayType(oid, typarray));
  }
  function addArrayType(oid, typarray) {
    if (!!options.parsers[typarray] && !!options.serializers[typarray]) return;
    const parser = options.parsers[oid];
    options.shared.typeArrayMap[oid] = typarray;
    options.parsers[typarray] = (xs) => arrayParser(xs, parser, typarray);
    options.parsers[typarray].array = true;
    options.serializers[typarray] = (xs) => arraySerializer(xs, options.serializers[oid], options, typarray);
  }
  function tryNext(x, xs) {
    return x === "read-write" && xs.default_transaction_read_only === "on" || x === "read-only" && xs.default_transaction_read_only === "off" || x === "primary" && xs.in_hot_standby === "on" || x === "standby" && xs.in_hot_standby === "off" || x === "prefer-standby" && xs.in_hot_standby === "off" && options.host[retries];
  }
  function fetchState() {
    const query2 = new Query([`
      show transaction_read_only;
      select pg_catalog.pg_is_in_recovery()
    `], [], execute, null, { simple: true });
    query2.resolve = ([[a], [b2]]) => {
      backendParameters.default_transaction_read_only = a.transaction_read_only;
      backendParameters.in_hot_standby = b2.pg_is_in_recovery ? "on" : "off";
    };
    query2.execute();
  }
  function ErrorResponse(x) {
    if (query) {
      (query.cursorFn || query.describeFirst) && write(Sync);
      errorResponse = Errors.postgres(parseError(x));
    } else {
      errored(Errors.postgres(parseError(x)));
    }
  }
  function retry(q, error2) {
    delete statements[q.signature];
    q.retried = error2;
    execute(q);
  }
  function NotificationResponse(x) {
    if (!onnotify)
      return;
    let index = 9;
    while (x[index++] !== 0) ;
    onnotify(
      x.toString("utf8", 9, index - 1),
      x.toString("utf8", index, x.length - 1)
    );
  }
  async function PortalSuspended() {
    try {
      const x = await Promise.resolve(query.cursorFn(result));
      rows = 0;
      x === CLOSE ? write(Close(query.portal)) : (result = new Result(), write(Execute("", query.cursorRows)));
    } catch (err) {
      write(Sync);
      query.reject(err);
    }
  }
  function CloseComplete() {
    result.count && query.cursorFn(result);
    query.resolve(result);
  }
  function CopyInResponse() {
    stream = new Stream.Writable({
      autoDestroy: true,
      write(chunk2, encoding, callback) {
        socket.write(bytes_default().d().raw(chunk2).end(), callback);
      },
      destroy(error2, callback) {
        callback(error2);
        socket.write(bytes_default().f().str(error2 + bytes_default.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(bytes_default().c().end());
        final = callback;
        stream = null;
      }
    });
    query.resolve(stream);
  }
  function CopyOutResponse() {
    stream = new Stream.Readable({
      read() {
        socket.resume();
      }
    });
    query.resolve(stream);
  }
  function CopyBothResponse() {
    stream = new Stream.Duplex({
      autoDestroy: true,
      read() {
        socket.resume();
      },
      /* c8 ignore next 11 */
      write(chunk2, encoding, callback) {
        socket.write(bytes_default().d().raw(chunk2).end(), callback);
      },
      destroy(error2, callback) {
        callback(error2);
        socket.write(bytes_default().f().str(error2 + bytes_default.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(bytes_default().c().end());
        final = callback;
      }
    });
    query.resolve(stream);
  }
  function CopyData(x) {
    stream && (stream.push(x.subarray(5)) || socket.pause());
  }
  function CopyDone() {
    stream && stream.push(null);
    stream = null;
  }
  function NoticeResponse(x) {
    onnotice ? onnotice(parseError(x)) : console.log(parseError(x));
  }
  function EmptyQueryResponse() {
  }
  function FunctionCallResponse() {
    errored(Errors.notSupported("FunctionCallResponse"));
  }
  function NegotiateProtocolVersion() {
    errored(Errors.notSupported("NegotiateProtocolVersion"));
  }
  function UnknownMessage(x) {
    console.error("Postgres.js : Unknown Message:", x[0]);
  }
  function UnknownAuth(x, type) {
    console.error("Postgres.js : Unknown Auth:", type);
  }
  function Bind(parameters, types2, statement = "", portal = "") {
    let prev, type;
    bytes_default().B().str(portal + bytes_default.N).str(statement + bytes_default.N).i16(0).i16(parameters.length);
    parameters.forEach((x, i) => {
      if (x === null)
        return bytes_default.i32(4294967295);
      type = types2[i];
      parameters[i] = x = type in options.serializers ? options.serializers[type](x) : "" + x;
      prev = bytes_default.i;
      bytes_default.inc(4).str(x).i32(bytes_default.i - prev - 4, prev);
    });
    bytes_default.i16(0);
    return bytes_default.end();
  }
  function Parse(str2, parameters, types2, name = "") {
    bytes_default().P().str(name + bytes_default.N).str(str2 + bytes_default.N).i16(parameters.length);
    parameters.forEach((x, i) => bytes_default.i32(types2[i] || 0));
    return bytes_default.end();
  }
  function Describe(x, name = "") {
    return bytes_default().D().str(x).str(name + bytes_default.N).end();
  }
  function Execute(portal = "", rows2 = 0) {
    return Buffer.concat([
      bytes_default().E().str(portal + bytes_default.N).i32(rows2).end(),
      Flush
    ]);
  }
  function Close(portal = "") {
    return Buffer.concat([
      bytes_default().C().str("P").str(portal + bytes_default.N).end(),
      bytes_default().S().end()
    ]);
  }
  function StartupMessage() {
    return cancelMessage || bytes_default().inc(4).i16(3).z(2).str(
      Object.entries(Object.assign(
        {
          user,
          database,
          client_encoding: "UTF8"
        },
        options.connection
      )).filter(([, v]) => v).map(([k, v]) => k + bytes_default.N + v).join(bytes_default.N)
    ).z(2).end(0);
  }
}
function parseError(x) {
  const error = {};
  let start = 5;
  for (let i = 5; i < x.length - 1; i++) {
    if (x[i] === 0) {
      error[errorFields[x[start]]] = x.toString("utf8", start + 1, i);
      start = i + 1;
    }
  }
  return error;
}
function md5(x) {
  return crypto2.createHash("md5").update(x).digest("hex");
}
function hmac(key, x) {
  return crypto2.createHmac("sha256", key).update(x).digest();
}
function sha256(x) {
  return crypto2.createHash("sha256").update(x).digest();
}
function xor(a, b2) {
  const length = Math.max(a.length, b2.length);
  const buffer2 = Buffer.allocUnsafe(length);
  for (let i = 0; i < length; i++)
    buffer2[i] = a[i] ^ b2[i];
  return buffer2;
}
function timer(fn, seconds) {
  seconds = typeof seconds === "function" ? seconds() : seconds;
  if (!seconds)
    return { cancel: noop, start: noop };
  let timer2;
  return {
    cancel() {
      timer2 && (clearTimeout(timer2), timer2 = null);
    },
    start() {
      timer2 && clearTimeout(timer2);
      timer2 = setTimeout(done, seconds * 1e3, arguments);
    }
  };
  function done(args) {
    fn.apply(null, args);
    timer2 = null;
  }
}
var connection_default, uid, Sync, Flush, SSLRequest, ExecuteUnnamed, DescribeUnnamed, noop, retryRoutines, errorFields;
var init_connection = __esm({
  "node_modules/postgres/src/connection.js"() {
    init_types();
    init_errors();
    init_result();
    init_queue();
    init_query();
    init_bytes();
    connection_default = Connection;
    uid = 1;
    Sync = bytes_default().S().end();
    Flush = bytes_default().H().end();
    SSLRequest = bytes_default().i32(8).i32(80877103).end(8);
    ExecuteUnnamed = Buffer.concat([bytes_default().E().str(bytes_default.N).i32(0).end(), Sync]);
    DescribeUnnamed = bytes_default().D().str("S").str(bytes_default.N).end();
    noop = () => {
    };
    retryRoutines = /* @__PURE__ */ new Set([
      "FetchPreparedStatement",
      "RevalidateCachedQuery",
      "transformAssignedExpr"
    ]);
    errorFields = {
      83: "severity_local",
      // S
      86: "severity",
      // V
      67: "code",
      // C
      77: "message",
      // M
      68: "detail",
      // D
      72: "hint",
      // H
      80: "position",
      // P
      112: "internal_position",
      // p
      113: "internal_query",
      // q
      87: "where",
      // W
      115: "schema_name",
      // s
      116: "table_name",
      // t
      99: "column_name",
      // c
      100: "data type_name",
      // d
      110: "constraint_name",
      // n
      70: "file",
      // F
      76: "line",
      // L
      82: "routine"
      // R
    };
  }
});

// node_modules/postgres/src/subscribe.js
function Subscribe(postgres2, options) {
  const subscribers = /* @__PURE__ */ new Map(), slot = "postgresjs_" + Math.random().toString(36).slice(2), state = {};
  let connection2, stream, ended = false;
  const sql2 = subscribe.sql = postgres2({
    ...options,
    transform: { column: {}, value: {}, row: {} },
    max: 1,
    fetch_types: false,
    idle_timeout: null,
    max_lifetime: null,
    connection: {
      ...options.connection,
      replication: "database"
    },
    onclose: async function() {
      if (ended)
        return;
      stream = null;
      state.pid = state.secret = void 0;
      connected(await init(sql2, slot, options.publications));
      subscribers.forEach((event) => event.forEach(({ onsubscribe }) => onsubscribe()));
    },
    no_subscribe: true
  });
  const end = sql2.end, close = sql2.close;
  sql2.end = async () => {
    ended = true;
    stream && await new Promise((r) => (stream.once("close", r), stream.end()));
    return end();
  };
  sql2.close = async () => {
    stream && await new Promise((r) => (stream.once("close", r), stream.end()));
    return close();
  };
  return subscribe;
  async function subscribe(event, fn, onsubscribe = noop2, onerror = noop2) {
    event = parseEvent(event);
    if (!connection2)
      connection2 = init(sql2, slot, options.publications);
    const subscriber = { fn, onsubscribe };
    const fns = subscribers.has(event) ? subscribers.get(event).add(subscriber) : subscribers.set(event, /* @__PURE__ */ new Set([subscriber])).get(event);
    const unsubscribe = () => {
      fns.delete(subscriber);
      fns.size === 0 && subscribers.delete(event);
    };
    return connection2.then((x) => {
      connected(x);
      onsubscribe();
      stream && stream.on("error", onerror);
      return { unsubscribe, state, sql: sql2 };
    });
  }
  function connected(x) {
    stream = x.stream;
    state.pid = x.state.pid;
    state.secret = x.state.secret;
  }
  async function init(sql3, slot2, publications) {
    if (!publications)
      throw new Error("Missing publication names");
    const xs = await sql3.unsafe(
      `CREATE_REPLICATION_SLOT ${slot2} TEMPORARY LOGICAL pgoutput NOEXPORT_SNAPSHOT`
    );
    const [x] = xs;
    const stream2 = await sql3.unsafe(
      `START_REPLICATION SLOT ${slot2} LOGICAL ${x.consistent_point} (proto_version '1', publication_names '${publications}')`
    ).writable();
    const state2 = {
      lsn: Buffer.concat(x.consistent_point.split("/").map((x2) => Buffer.from(("00000000" + x2).slice(-8), "hex")))
    };
    stream2.on("data", data);
    stream2.on("error", error);
    stream2.on("close", sql3.close);
    return { stream: stream2, state: xs.state };
    function error(e) {
      console.error("Unexpected error during logical streaming - reconnecting", e);
    }
    function data(x2) {
      if (x2[0] === 119) {
        parse(x2.subarray(25), state2, sql3.options.parsers, handle2, options.transform);
      } else if (x2[0] === 107 && x2[17]) {
        state2.lsn = x2.subarray(1, 9);
        pong();
      }
    }
    function handle2(a, b2) {
      const path = b2.relation.schema + "." + b2.relation.table;
      call("*", a, b2);
      call("*:" + path, a, b2);
      b2.relation.keys.length && call("*:" + path + "=" + b2.relation.keys.map((x2) => a[x2.name]), a, b2);
      call(b2.command, a, b2);
      call(b2.command + ":" + path, a, b2);
      b2.relation.keys.length && call(b2.command + ":" + path + "=" + b2.relation.keys.map((x2) => a[x2.name]), a, b2);
    }
    function pong() {
      const x2 = Buffer.alloc(34);
      x2[0] = "r".charCodeAt(0);
      x2.fill(state2.lsn, 1);
      x2.writeBigInt64BE(BigInt(Date.now() - Date.UTC(2e3, 0, 1)) * BigInt(1e3), 25);
      stream2.write(x2);
    }
  }
  function call(x, a, b2) {
    subscribers.has(x) && subscribers.get(x).forEach(({ fn }) => fn(a, b2, x));
  }
}
function Time(x) {
  return new Date(Date.UTC(2e3, 0, 1) + Number(x / BigInt(1e3)));
}
function parse(x, state, parsers2, handle2, transform) {
  const char = (acc, [k, v]) => (acc[k.charCodeAt(0)] = v, acc);
  Object.entries({
    R: (x2) => {
      let i = 1;
      const r = state[x2.readUInt32BE(i)] = {
        schema: x2.toString("utf8", i += 4, i = x2.indexOf(0, i)) || "pg_catalog",
        table: x2.toString("utf8", i + 1, i = x2.indexOf(0, i + 1)),
        columns: Array(x2.readUInt16BE(i += 2)),
        keys: []
      };
      i += 2;
      let columnIndex = 0, column;
      while (i < x2.length) {
        column = r.columns[columnIndex++] = {
          key: x2[i++],
          name: transform.column.from ? transform.column.from(x2.toString("utf8", i, i = x2.indexOf(0, i))) : x2.toString("utf8", i, i = x2.indexOf(0, i)),
          type: x2.readUInt32BE(i += 1),
          parser: parsers2[x2.readUInt32BE(i)],
          atttypmod: x2.readUInt32BE(i += 4)
        };
        column.key && r.keys.push(column);
        i += 4;
      }
    },
    Y: () => {
    },
    // Type
    O: () => {
    },
    // Origin
    B: (x2) => {
      state.date = Time(x2.readBigInt64BE(9));
      state.lsn = x2.subarray(1, 9);
    },
    I: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      const { row } = tuples(x2, relation.columns, i += 7, transform);
      handle2(row, {
        command: "insert",
        relation
      });
    },
    D: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      i += 4;
      const key = x2[i] === 75;
      handle2(
        key || x2[i] === 79 ? tuples(x2, relation.columns, i += 3, transform).row : null,
        {
          command: "delete",
          relation,
          key
        }
      );
    },
    U: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      i += 4;
      const key = x2[i] === 75;
      const xs = key || x2[i] === 79 ? tuples(x2, relation.columns, i += 3, transform) : null;
      xs && (i = xs.i);
      const { row } = tuples(x2, relation.columns, i + 3, transform);
      handle2(row, {
        command: "update",
        relation,
        key,
        old: xs && xs.row
      });
    },
    T: () => {
    },
    // Truncate,
    C: () => {
    }
    // Commit
  }).reduce(char, {})[x[0]](x);
}
function tuples(x, columns, xi, transform) {
  let type, column, value;
  const row = transform.raw ? new Array(columns.length) : {};
  for (let i = 0; i < columns.length; i++) {
    type = x[xi++];
    column = columns[i];
    value = type === 110 ? null : type === 117 ? void 0 : column.parser === void 0 ? x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)) : column.parser.array === true ? column.parser(x.toString("utf8", xi + 5, xi += 4 + x.readUInt32BE(xi))) : column.parser(x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)));
    transform.raw ? row[i] = transform.raw === true ? value : transform.value.from ? transform.value.from(value, column) : value : row[column.name] = transform.value.from ? transform.value.from(value, column) : value;
  }
  return { i: xi, row: transform.row.from ? transform.row.from(row) : row };
}
function parseEvent(x) {
  const xs = x.match(/^(\*|insert|update|delete)?:?([^.]+?\.?[^=]+)?=?(.+)?/i) || [];
  if (!xs)
    throw new Error("Malformed subscribe pattern: " + x);
  const [, command, path, key] = xs;
  return (command || "*") + (path ? ":" + (path.indexOf(".") === -1 ? "public." + path : path) : "") + (key ? "=" + key : "");
}
var noop2;
var init_subscribe = __esm({
  "node_modules/postgres/src/subscribe.js"() {
    noop2 = () => {
    };
  }
});

// node_modules/postgres/src/large.js
import Stream2 from "stream";
function largeObject(sql2, oid, mode = 131072 | 262144) {
  return new Promise(async (resolve, reject) => {
    await sql2.begin(async (sql3) => {
      let finish;
      !oid && ([{ oid }] = await sql3`select lo_creat(-1) as oid`);
      const [{ fd }] = await sql3`select lo_open(${oid}, ${mode}) as fd`;
      const lo = {
        writable,
        readable,
        close: () => sql3`select lo_close(${fd})`.then(finish),
        tell: () => sql3`select lo_tell64(${fd})`,
        read: (x) => sql3`select loread(${fd}, ${x}) as data`,
        write: (x) => sql3`select lowrite(${fd}, ${x})`,
        truncate: (x) => sql3`select lo_truncate64(${fd}, ${x})`,
        seek: (x, whence = 0) => sql3`select lo_lseek64(${fd}, ${x}, ${whence})`,
        size: () => sql3`
          select
            lo_lseek64(${fd}, location, 0) as position,
            seek.size
          from (
            select
              lo_lseek64($1, 0, 2) as size,
              tell.location
            from (select lo_tell64($1) as location) tell
          ) seek
        `
      };
      resolve(lo);
      return new Promise(async (r) => finish = r);
      async function readable({
        highWaterMark = 2048 * 8,
        start = 0,
        end = Infinity
      } = {}) {
        let max = end - start;
        start && await lo.seek(start);
        return new Stream2.Readable({
          highWaterMark,
          async read(size2) {
            const l = size2 > max ? size2 - max : size2;
            max -= size2;
            const [{ data }] = await lo.read(l);
            this.push(data);
            if (data.length < size2)
              this.push(null);
          }
        });
      }
      async function writable({
        highWaterMark = 2048 * 8,
        start = 0
      } = {}) {
        start && await lo.seek(start);
        return new Stream2.Writable({
          highWaterMark,
          write(chunk, encoding, callback) {
            lo.write(chunk).then(() => callback(), callback);
          }
        });
      }
    }).catch(reject);
  });
}
var init_large = __esm({
  "node_modules/postgres/src/large.js"() {
  }
});

// node_modules/postgres/src/index.js
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
import os from "os";
import fs from "fs";
function Postgres(a, b2) {
  const options = parseOptions(a, b2), subscribe = options.no_subscribe || Subscribe(Postgres, { ...options });
  let ending = false;
  const queries = queue_default(), connecting = queue_default(), reserved = queue_default(), closed = queue_default(), ended = queue_default(), open = queue_default(), busy = queue_default(), full2 = queue_default(), queues = { connecting, reserved, closed, ended, open, busy, full: full2 };
  const connections = [...Array(options.max)].map(() => connection_default(options, queues, { onopen, onend, onclose }));
  const sql2 = Sql(handler);
  Object.assign(sql2, {
    get parameters() {
      return options.parameters;
    },
    largeObject: largeObject.bind(null, sql2),
    subscribe,
    CLOSE,
    END: CLOSE,
    PostgresError,
    options,
    reserve,
    listen,
    begin,
    close,
    end
  });
  return sql2;
  function Sql(handler2) {
    handler2.debug = options.debug;
    Object.entries(options.types).reduce((acc, [name, type]) => {
      acc[name] = (x) => new Parameter(x, type.to);
      return acc;
    }, typed);
    Object.assign(sql3, {
      types: typed,
      typed,
      unsafe,
      notify,
      array,
      json: json2,
      file
    });
    return sql3;
    function typed(value, type) {
      return new Parameter(value, type);
    }
    function sql3(strings, ...args) {
      const query = strings && Array.isArray(strings.raw) ? new Query(strings, args, handler2, cancel) : typeof strings === "string" && !args.length ? new Identifier(options.transform.column.to ? options.transform.column.to(strings) : strings) : new Builder(strings, args);
      return query;
    }
    function unsafe(string, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const query = new Query([string], args, handler2, cancel, {
        prepare: false,
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
      return query;
    }
    function file(path, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const query = new Query([], args, (query2) => {
        fs.readFile(path, "utf8", (err, string) => {
          if (err)
            return query2.reject(err);
          query2.strings = [string];
          handler2(query2);
        });
      }, cancel, {
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
      return query;
    }
  }
  async function listen(name, fn, onlisten) {
    const listener = { fn, onlisten };
    const sql3 = listen.sql || (listen.sql = Postgres({
      ...options,
      max: 1,
      idle_timeout: null,
      max_lifetime: null,
      fetch_types: false,
      onclose() {
        Object.entries(listen.channels).forEach(([name2, { listeners }]) => {
          delete listen.channels[name2];
          Promise.all(listeners.map((l) => listen(name2, l.fn, l.onlisten).catch(() => {
          })));
        });
      },
      onnotify(c, x) {
        c in listen.channels && listen.channels[c].listeners.forEach((l) => l.fn(x));
      }
    }));
    const channels = listen.channels || (listen.channels = {}), exists = name in channels;
    if (exists) {
      channels[name].listeners.push(listener);
      const result2 = await channels[name].result;
      listener.onlisten && listener.onlisten();
      return { state: result2.state, unlisten };
    }
    channels[name] = { result: sql3`listen ${sql3.unsafe('"' + name.replace(/"/g, '""') + '"')}`, listeners: [listener] };
    const result = await channels[name].result;
    listener.onlisten && listener.onlisten();
    return { state: result.state, unlisten };
    async function unlisten() {
      if (name in channels === false)
        return;
      channels[name].listeners = channels[name].listeners.filter((x) => x !== listener);
      if (channels[name].listeners.length)
        return;
      delete channels[name];
      return sql3`unlisten ${sql3.unsafe('"' + name.replace(/"/g, '""') + '"')}`;
    }
  }
  async function notify(channel, payload) {
    return await sql2`select pg_notify(${channel}, ${"" + payload})`;
  }
  async function reserve() {
    const queue = queue_default();
    const c = open.length ? open.shift() : await new Promise((resolve, reject) => {
      const query = { reserve: resolve, reject };
      queries.push(query);
      closed.length && connect(closed.shift(), query);
    });
    move(c, reserved);
    c.reserved = () => queue.length ? c.execute(queue.shift()) : move(c, reserved);
    c.reserved.release = true;
    const sql3 = Sql(handler2);
    sql3.release = () => {
      c.reserved = null;
      onopen(c);
    };
    return sql3;
    function handler2(q) {
      c.queue === full2 ? queue.push(q) : c.execute(q) || move(c, full2);
    }
  }
  async function begin(options2, fn) {
    !fn && (fn = options2, options2 = "");
    const queries2 = queue_default();
    let savepoints = 0, connection2, prepare = null;
    try {
      await sql2.unsafe("begin " + options2.replace(/[^a-z ]/ig, ""), [], { onexecute }).execute();
      return await Promise.race([
        scope(connection2, fn),
        new Promise((_, reject) => connection2.onclose = reject)
      ]);
    } catch (error) {
      throw error;
    }
    async function scope(c, fn2, name) {
      const sql3 = Sql(handler2);
      sql3.savepoint = savepoint;
      sql3.prepare = (x) => prepare = x.replace(/[^a-z0-9$-_. ]/gi);
      let uncaughtError, result;
      name && await sql3`savepoint ${sql3(name)}`;
      try {
        result = await new Promise((resolve, reject) => {
          const x = fn2(sql3);
          Promise.resolve(Array.isArray(x) ? Promise.all(x) : x).then(resolve, reject);
        });
        if (uncaughtError)
          throw uncaughtError;
      } catch (e) {
        await (name ? sql3`rollback to ${sql3(name)}` : sql3`rollback`);
        throw e instanceof PostgresError && e.code === "25P02" && uncaughtError || e;
      }
      if (!name) {
        prepare ? await sql3`prepare transaction '${sql3.unsafe(prepare)}'` : await sql3`commit`;
      }
      return result;
      function savepoint(name2, fn3) {
        if (name2 && Array.isArray(name2.raw))
          return savepoint((sql4) => sql4.apply(sql4, arguments));
        arguments.length === 1 && (fn3 = name2, name2 = null);
        return scope(c, fn3, "s" + savepoints++ + (name2 ? "_" + name2 : ""));
      }
      function handler2(q) {
        q.catch((e) => uncaughtError || (uncaughtError = e));
        c.queue === full2 ? queries2.push(q) : c.execute(q) || move(c, full2);
      }
    }
    function onexecute(c) {
      connection2 = c;
      move(c, reserved);
      c.reserved = () => queries2.length ? c.execute(queries2.shift()) : move(c, reserved);
    }
  }
  function move(c, queue) {
    c.queue.remove(c);
    queue.push(c);
    c.queue = queue;
    queue === open ? c.idleTimer.start() : c.idleTimer.cancel();
    return c;
  }
  function json2(x) {
    return new Parameter(x, 3802);
  }
  function array(x, type) {
    if (!Array.isArray(x))
      return array(Array.from(arguments));
    return new Parameter(x, type || (x.length ? inferType(x) || 25 : 0), options.shared.typeArrayMap);
  }
  function handler(query) {
    if (ending)
      return query.reject(Errors.connection("CONNECTION_ENDED", options, options));
    if (open.length)
      return go(open.shift(), query);
    if (closed.length)
      return connect(closed.shift(), query);
    busy.length ? go(busy.shift(), query) : queries.push(query);
  }
  function go(c, query) {
    return c.execute(query) ? move(c, busy) : move(c, full2);
  }
  function cancel(query) {
    return new Promise((resolve, reject) => {
      query.state ? query.active ? connection_default(options).cancel(query.state, resolve, reject) : query.cancelled = { resolve, reject } : (queries.remove(query), query.cancelled = true, query.reject(Errors.generic("57014", "canceling statement due to user request")), resolve());
    });
  }
  async function end({ timeout = null } = {}) {
    if (ending)
      return ending;
    await 1;
    let timer2;
    return ending = Promise.race([
      new Promise((r) => timeout !== null && (timer2 = setTimeout(destroy, timeout * 1e3, r))),
      Promise.all(connections.map((c) => c.end()).concat(
        listen.sql ? listen.sql.end({ timeout: 0 }) : [],
        subscribe.sql ? subscribe.sql.end({ timeout: 0 }) : []
      ))
    ]).then(() => clearTimeout(timer2));
  }
  async function close() {
    await Promise.all(connections.map((c) => c.end()));
  }
  async function destroy(resolve) {
    await Promise.all(connections.map((c) => c.terminate()));
    while (queries.length)
      queries.shift().reject(Errors.connection("CONNECTION_DESTROYED", options));
    resolve();
  }
  function connect(c, query) {
    move(c, connecting);
    c.connect(query);
    return c;
  }
  function onend(c) {
    move(c, ended);
  }
  function onopen(c) {
    if (queries.length === 0)
      return move(c, open);
    let max = Math.ceil(queries.length / (connecting.length + 1)), ready = true;
    while (ready && queries.length && max-- > 0) {
      const query = queries.shift();
      if (query.reserve)
        return query.reserve(c);
      ready = c.execute(query);
    }
    ready ? move(c, busy) : move(c, full2);
  }
  function onclose(c, e) {
    move(c, closed);
    c.reserved = null;
    c.onclose && (c.onclose(e), c.onclose = null);
    options.onclose && options.onclose(c.id);
    queries.length && connect(c, queries.shift());
  }
}
function parseOptions(a, b2) {
  if (a && a.shared)
    return a;
  const env = process.env, o = (!a || typeof a === "string" ? b2 : a) || {}, { url, multihost } = parseUrl(a), query = [...url.searchParams].reduce((a2, [b3, c]) => (a2[b3] = c, a2), {}), host = o.hostname || o.host || multihost || url.hostname || env.PGHOST || "localhost", port = o.port || url.port || env.PGPORT || 5432, user = o.user || o.username || url.username || env.PGUSERNAME || env.PGUSER || osUsername();
  o.no_prepare && (o.prepare = false);
  query.sslmode && (query.ssl = query.sslmode, delete query.sslmode);
  "timeout" in o && (console.log("The timeout option is deprecated, use idle_timeout instead"), o.idle_timeout = o.timeout);
  query.sslrootcert === "system" && (query.ssl = "verify-full");
  const ints = ["idle_timeout", "connect_timeout", "max_lifetime", "max_pipeline", "backoff", "keep_alive"];
  const defaults = {
    max: globalThis.Cloudflare ? 3 : 10,
    ssl: false,
    sslnegotiation: null,
    idle_timeout: null,
    connect_timeout: 30,
    max_lifetime,
    max_pipeline: 100,
    backoff,
    keep_alive: 60,
    prepare: true,
    debug: false,
    fetch_types: true,
    publications: "alltables",
    target_session_attrs: null
  };
  return {
    host: Array.isArray(host) ? host : host.split(",").map((x) => x.split(":")[0]),
    port: Array.isArray(port) ? port : host.split(",").map((x) => parseInt(x.split(":")[1] || port)),
    path: o.path || host.indexOf("/") > -1 && host + "/.s.PGSQL." + port,
    database: o.database || o.db || (url.pathname || "").slice(1) || env.PGDATABASE || user,
    user,
    pass: o.pass || o.password || url.password || env.PGPASSWORD || "",
    ...Object.entries(defaults).reduce(
      (acc, [k, d]) => {
        const value = k in o ? o[k] : k in query ? query[k] === "disable" || query[k] === "false" ? false : query[k] : env["PG" + k.toUpperCase()] || d;
        acc[k] = typeof value === "string" && ints.includes(k) ? +value : value;
        return acc;
      },
      {}
    ),
    connection: {
      application_name: env.PGAPPNAME || "postgres.js",
      ...o.connection,
      ...Object.entries(query).reduce((acc, [k, v]) => (k in defaults || (acc[k] = v), acc), {})
    },
    types: o.types || {},
    target_session_attrs: tsa(o, url, env),
    onnotice: o.onnotice,
    onnotify: o.onnotify,
    onclose: o.onclose,
    onparameter: o.onparameter,
    socket: o.socket,
    transform: parseTransform(o.transform || { undefined: void 0 }),
    parameters: {},
    shared: { retries: 0, typeArrayMap: {} },
    ...mergeUserTypes(o.types)
  };
}
function tsa(o, url, env) {
  const x = o.target_session_attrs || url.searchParams.get("target_session_attrs") || env.PGTARGETSESSIONATTRS;
  if (!x || ["read-write", "read-only", "primary", "standby", "prefer-standby"].includes(x))
    return x;
  throw new Error("target_session_attrs " + x + " is not supported");
}
function backoff(retries) {
  return (0.5 + Math.random() / 2) * Math.min(3 ** retries / 100, 20);
}
function max_lifetime() {
  return 60 * (30 + Math.random() * 30);
}
function parseTransform(x) {
  return {
    undefined: x.undefined,
    column: {
      from: typeof x.column === "function" ? x.column : x.column && x.column.from,
      to: x.column && x.column.to
    },
    value: {
      from: typeof x.value === "function" ? x.value : x.value && x.value.from,
      to: x.value && x.value.to
    },
    row: {
      from: typeof x.row === "function" ? x.row : x.row && x.row.from,
      to: x.row && x.row.to
    }
  };
}
function parseUrl(url) {
  if (!url || typeof url !== "string")
    return { url: { searchParams: /* @__PURE__ */ new Map() } };
  let host = url;
  host = host.slice(host.indexOf("://") + 3).split(/[?/]/)[0];
  host = decodeURIComponent(host.slice(host.indexOf("@") + 1));
  const urlObj = new URL(url.replace(host, host.split(",")[0]));
  return {
    url: {
      username: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      searchParams: urlObj.searchParams
    },
    multihost: host.indexOf(",") > -1 && host
  };
}
function osUsername() {
  try {
    return os.userInfo().username;
  } catch (_) {
    return process.env.USERNAME || process.env.USER || process.env.LOGNAME;
  }
}
var src_default;
var init_src = __esm({
  "node_modules/postgres/src/index.js"() {
    init_types();
    init_connection();
    init_query();
    init_queue();
    init_errors();
    init_subscribe();
    init_large();
    Object.assign(Postgres, {
      PostgresError,
      toPascal,
      pascal,
      toCamel,
      camel,
      toKebab,
      kebab,
      fromPascal,
      fromCamel,
      fromKebab,
      BigInt: {
        to: 20,
        from: [20],
        parse: (x) => BigInt(x),
        // eslint-disable-line
        serialize: (x) => x.toString()
      }
    });
    src_default = Postgres;
  }
});

// node_modules/tslib/tslib.es6.mjs
var tslib_es6_exports = {};
__export(tslib_es6_exports, {
  __addDisposableResource: () => __addDisposableResource,
  __assign: () => __assign,
  __asyncDelegator: () => __asyncDelegator,
  __asyncGenerator: () => __asyncGenerator,
  __asyncValues: () => __asyncValues,
  __await: () => __await,
  __awaiter: () => __awaiter,
  __classPrivateFieldGet: () => __classPrivateFieldGet,
  __classPrivateFieldIn: () => __classPrivateFieldIn,
  __classPrivateFieldSet: () => __classPrivateFieldSet,
  __createBinding: () => __createBinding,
  __decorate: () => __decorate,
  __disposeResources: () => __disposeResources,
  __esDecorate: () => __esDecorate,
  __exportStar: () => __exportStar,
  __extends: () => __extends,
  __generator: () => __generator,
  __importDefault: () => __importDefault,
  __importStar: () => __importStar,
  __makeTemplateObject: () => __makeTemplateObject,
  __metadata: () => __metadata,
  __param: () => __param,
  __propKey: () => __propKey,
  __read: () => __read,
  __rest: () => __rest,
  __rewriteRelativeImportExtension: () => __rewriteRelativeImportExtension,
  __runInitializers: () => __runInitializers,
  __setFunctionName: () => __setFunctionName,
  __spread: () => __spread,
  __spreadArray: () => __spreadArray,
  __spreadArrays: () => __spreadArrays,
  __values: () => __values,
  default: () => tslib_es6_default
});
function __extends(d, b2) {
  if (typeof b2 !== "function" && b2 !== null)
    throw new TypeError("Class extends value " + String(b2) + " is not a constructor or null");
  extendStatics(d, b2);
  function __() {
    this.constructor = d;
  }
  d.prototype = b2 === null ? Object.create(b2) : (__.prototype = b2.prototype, new __());
}
function __rest(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
}
function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function __param(paramIndex, decorator) {
  return function(target, key) {
    decorator(target, key, paramIndex);
  };
}
function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
}
function __runInitializers(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
}
function __propKey(x) {
  return typeof x === "symbol" ? x : "".concat(x);
}
function __setFunctionName(f, name, prefix) {
  if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
  return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
}
function __metadata(metadataKey, metadataValue) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
  return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}
function __exportStar(m, o) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}
function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function() {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
}
function __spread() {
  for (var ar = [], i = 0; i < arguments.length; i++)
    ar = ar.concat(__read(arguments[i]));
  return ar;
}
function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
      r[k] = a[j];
  return r;
}
function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}
function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function awaitReturn(f) {
    return function(v) {
      return Promise.resolve(v).then(f, reject);
    };
  }
  function verb(n, f) {
    if (g[n]) {
      i[n] = function(v) {
        return new Promise(function(a, b2) {
          q.push([n, v, a, b2]) > 1 || resume(n, v);
        });
      };
      if (f) i[n] = f(i[n]);
    }
  }
  function resume(n, v) {
    try {
      step(g[n](v));
    } catch (e) {
      settle(q[0][3], e);
    }
  }
  function step(r) {
    r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
  }
  function fulfill(value) {
    resume("next", value);
  }
  function reject(value) {
    resume("throw", value);
  }
  function settle(f, v) {
    if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
  }
}
function __asyncDelegator(o) {
  var i, p;
  return i = {}, verb("next"), verb("throw", function(e) {
    throw e;
  }), verb("return"), i[Symbol.iterator] = function() {
    return this;
  }, i;
  function verb(n, f) {
    i[n] = o[n] ? function(v) {
      return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v;
    } : f;
  }
}
function __asyncValues(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i);
  function verb(n) {
    i[n] = o[n] && function(v) {
      return new Promise(function(resolve, reject) {
        v = o[n](v), settle(resolve, reject, v.done, v.value);
      });
    };
  }
  function settle(resolve, reject, d, v) {
    Promise.resolve(v).then(function(v2) {
      resolve({ value: v2, done: d });
    }, reject);
  }
}
function __makeTemplateObject(cooked, raw) {
  if (Object.defineProperty) {
    Object.defineProperty(cooked, "raw", { value: raw });
  } else {
    cooked.raw = raw;
  }
  return cooked;
}
function __importStar(mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) {
    for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
  }
  __setModuleDefault(result, mod);
  return result;
}
function __importDefault(mod) {
  return mod && mod.__esModule ? mod : { default: mod };
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function __classPrivateFieldIn(state, receiver) {
  if (receiver === null || typeof receiver !== "object" && typeof receiver !== "function") throw new TypeError("Cannot use 'in' operator on non-object");
  return typeof state === "function" ? receiver === state : state.has(receiver);
}
function __addDisposableResource(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
}
function __disposeResources(env) {
  function fail2(e) {
    env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
    env.hasError = true;
  }
  var r, s = 0;
  function next() {
    while (r = env.stack.pop()) {
      try {
        if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
        if (r.dispose) {
          var result = r.dispose.call(r.value);
          if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
            fail2(e);
            return next();
          });
        } else s |= 1;
      } catch (e) {
        fail2(e);
      }
    }
    if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
    if (env.hasError) throw env.error;
  }
  return next();
}
function __rewriteRelativeImportExtension(path, preserveJsx) {
  if (typeof path === "string" && /^\.\.?\//.test(path)) {
    return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
      return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
    });
  }
  return path;
}
var extendStatics, __assign, __createBinding, __setModuleDefault, ownKeys, _SuppressedError, tslib_es6_default;
var init_tslib_es6 = __esm({
  "node_modules/tslib/tslib.es6.mjs"() {
    extendStatics = function(d, b2) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b3) {
        d2.__proto__ = b3;
      } || function(d2, b3) {
        for (var p in b3) if (Object.prototype.hasOwnProperty.call(b3, p)) d2[p] = b3[p];
      };
      return extendStatics(d, b2);
    };
    __assign = function() {
      __assign = Object.assign || function __assign2(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    __createBinding = Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    __setModuleDefault = Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    };
    ownKeys = function(o) {
      ownKeys = Object.getOwnPropertyNames || function(o2) {
        var ar = [];
        for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
        return ar;
      };
      return ownKeys(o);
    };
    _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
      var e = new Error(message);
      return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    tslib_es6_default = {
      __extends,
      __assign,
      __rest,
      __decorate,
      __param,
      __esDecorate,
      __runInitializers,
      __propKey,
      __setFunctionName,
      __metadata,
      __awaiter,
      __generator,
      __createBinding,
      __exportStar,
      __values,
      __read,
      __spread,
      __spreadArrays,
      __spreadArray,
      __await,
      __asyncGenerator,
      __asyncDelegator,
      __asyncValues,
      __makeTemplateObject,
      __importStar,
      __importDefault,
      __classPrivateFieldGet,
      __classPrivateFieldSet,
      __classPrivateFieldIn,
      __addDisposableResource,
      __disposeResources,
      __rewriteRelativeImportExtension
    };
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/version.js
var require_version = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/version.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.version = void 0;
    exports.version = "2.119.0";
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/constants.js
var require_constants = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JWKS_TTL = exports.PKCE_MAX_CONCURRENT_FLOWS = exports.PKCE_FLOW_ID_PARAM = exports.BASE64URL_REGEX = exports.API_VERSIONS = exports.API_VERSION_HEADER_NAME = exports.NETWORK_FAILURE = exports.DEFAULT_HEADERS = exports.AUDIENCE = exports.STORAGE_KEY = exports.GOTRUE_URL = exports.REFRESH_FAILURE_COOLDOWN_MS = exports.EXPIRY_MARGIN_MS = exports.AUTO_REFRESH_TICK_THRESHOLD = exports.AUTO_REFRESH_TICK_DURATION_MS = void 0;
    var version_1 = require_version();
    exports.AUTO_REFRESH_TICK_DURATION_MS = 30 * 1e3;
    exports.AUTO_REFRESH_TICK_THRESHOLD = 3;
    exports.EXPIRY_MARGIN_MS = exports.AUTO_REFRESH_TICK_THRESHOLD * exports.AUTO_REFRESH_TICK_DURATION_MS;
    exports.REFRESH_FAILURE_COOLDOWN_MS = 2 * exports.AUTO_REFRESH_TICK_DURATION_MS;
    exports.GOTRUE_URL = "http://localhost:9999";
    exports.STORAGE_KEY = "supabase.auth.token";
    exports.AUDIENCE = "";
    exports.DEFAULT_HEADERS = { "X-Client-Info": `gotrue-js/${version_1.version}` };
    exports.NETWORK_FAILURE = {
      MAX_RETRIES: 10,
      RETRY_INTERVAL: 2
      // in deciseconds
    };
    exports.API_VERSION_HEADER_NAME = "X-Supabase-Api-Version";
    exports.API_VERSIONS = {
      "2024-01-01": {
        timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
        name: "2024-01-01"
      }
    };
    exports.BASE64URL_REGEX = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i;
    exports.PKCE_FLOW_ID_PARAM = "sb_flow_id";
    exports.PKCE_MAX_CONCURRENT_FLOWS = 5;
    exports.JWKS_TTL = 10 * 60 * 1e3;
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/errors.js
var require_errors = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthInvalidJwtError = exports.AuthWeakPasswordError = exports.AuthRefreshDiscardedError = exports.AuthRetryableFetchError = exports.AuthPKCECodeVerifierMissingError = exports.AuthPKCEGrantCodeExchangeError = exports.AuthImplicitGrantRedirectError = exports.AuthInvalidCredentialsError = exports.AuthInvalidTokenResponseError = exports.AuthSessionMissingError = exports.CustomAuthError = exports.AuthUnknownError = exports.AuthApiError = exports.AuthError = void 0;
    exports.isAuthError = isAuthError;
    exports.isAuthApiError = isAuthApiError;
    exports.isAuthSessionMissingError = isAuthSessionMissingError;
    exports.isAuthImplicitGrantRedirectError = isAuthImplicitGrantRedirectError;
    exports.isAuthPKCECodeVerifierMissingError = isAuthPKCECodeVerifierMissingError;
    exports.isAuthRetryableFetchError = isAuthRetryableFetchError;
    exports.isAuthRefreshDiscardedError = isAuthRefreshDiscardedError;
    exports.isAuthWeakPasswordError = isAuthWeakPasswordError;
    var AuthError = class extends Error {
      constructor(message, status2, code) {
        super(message);
        this.__isAuthError = true;
        this.name = "AuthError";
        this.status = status2;
        this.code = code;
      }
      toJSON() {
        return {
          name: this.name,
          message: this.message,
          status: this.status,
          code: this.code
        };
      }
    };
    exports.AuthError = AuthError;
    function isAuthError(error) {
      return typeof error === "object" && error !== null && "__isAuthError" in error;
    }
    var AuthApiError = class extends AuthError {
      constructor(message, status2, code) {
        super(message, status2, code);
        this.name = "AuthApiError";
        this.status = status2;
        this.code = code;
      }
    };
    exports.AuthApiError = AuthApiError;
    function isAuthApiError(error) {
      return isAuthError(error) && error.name === "AuthApiError";
    }
    var AuthUnknownError = class extends AuthError {
      constructor(message, originalError) {
        super(message);
        this.name = "AuthUnknownError";
        this.originalError = originalError;
      }
    };
    exports.AuthUnknownError = AuthUnknownError;
    var CustomAuthError = class extends AuthError {
      constructor(message, name, status2, code) {
        super(message, status2, code);
        this.name = name;
        this.status = status2;
      }
    };
    exports.CustomAuthError = CustomAuthError;
    var AuthSessionMissingError = class extends CustomAuthError {
      constructor() {
        super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
      }
    };
    exports.AuthSessionMissingError = AuthSessionMissingError;
    function isAuthSessionMissingError(error) {
      return isAuthError(error) && error.name === "AuthSessionMissingError";
    }
    var AuthInvalidTokenResponseError = class extends CustomAuthError {
      constructor() {
        super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
      }
    };
    exports.AuthInvalidTokenResponseError = AuthInvalidTokenResponseError;
    var AuthInvalidCredentialsError = class extends CustomAuthError {
      constructor(message) {
        super(message, "AuthInvalidCredentialsError", 400, void 0);
      }
    };
    exports.AuthInvalidCredentialsError = AuthInvalidCredentialsError;
    var AuthImplicitGrantRedirectError = class extends CustomAuthError {
      constructor(message, details = null) {
        super(message, "AuthImplicitGrantRedirectError", 500, void 0);
        this.details = null;
        this.details = details;
      }
      toJSON() {
        return Object.assign(Object.assign({}, super.toJSON()), { details: this.details });
      }
    };
    exports.AuthImplicitGrantRedirectError = AuthImplicitGrantRedirectError;
    function isAuthImplicitGrantRedirectError(error) {
      return isAuthError(error) && error.name === "AuthImplicitGrantRedirectError";
    }
    var AuthPKCEGrantCodeExchangeError = class extends CustomAuthError {
      constructor(message, details = null) {
        super(message, "AuthPKCEGrantCodeExchangeError", 500, void 0);
        this.details = null;
        this.details = details;
      }
      toJSON() {
        return Object.assign(Object.assign({}, super.toJSON()), { details: this.details });
      }
    };
    exports.AuthPKCEGrantCodeExchangeError = AuthPKCEGrantCodeExchangeError;
    var AuthPKCECodeVerifierMissingError = class extends CustomAuthError {
      constructor() {
        super("PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.", "AuthPKCECodeVerifierMissingError", 400, "pkce_code_verifier_not_found");
      }
    };
    exports.AuthPKCECodeVerifierMissingError = AuthPKCECodeVerifierMissingError;
    function isAuthPKCECodeVerifierMissingError(error) {
      return isAuthError(error) && error.name === "AuthPKCECodeVerifierMissingError";
    }
    var AuthRetryableFetchError = class extends CustomAuthError {
      constructor(message, status2) {
        super(message, "AuthRetryableFetchError", status2, void 0);
      }
    };
    exports.AuthRetryableFetchError = AuthRetryableFetchError;
    function isAuthRetryableFetchError(error) {
      return isAuthError(error) && error.name === "AuthRetryableFetchError";
    }
    var AuthRefreshDiscardedError = class extends CustomAuthError {
      constructor(message = "Refresh result discarded: session state changed mid-flight (e.g., concurrent signOut)") {
        super(message, "AuthRefreshDiscardedError", 409, void 0);
      }
    };
    exports.AuthRefreshDiscardedError = AuthRefreshDiscardedError;
    function isAuthRefreshDiscardedError(error) {
      return isAuthError(error) && error.name === "AuthRefreshDiscardedError";
    }
    var AuthWeakPasswordError = class extends CustomAuthError {
      constructor(message, status2, reasons) {
        super(message, "AuthWeakPasswordError", status2, "weak_password");
        this.reasons = reasons;
      }
      toJSON() {
        return Object.assign(Object.assign({}, super.toJSON()), { reasons: this.reasons });
      }
    };
    exports.AuthWeakPasswordError = AuthWeakPasswordError;
    function isAuthWeakPasswordError(error) {
      return isAuthError(error) && error.name === "AuthWeakPasswordError";
    }
    var AuthInvalidJwtError = class extends CustomAuthError {
      constructor(message) {
        super(message, "AuthInvalidJwtError", 400, "invalid_jwt");
      }
    };
    exports.AuthInvalidJwtError = AuthInvalidJwtError;
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/base64url.js
var require_base64url = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/base64url.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.byteToBase64URL = byteToBase64URL;
    exports.byteFromBase64URL = byteFromBase64URL;
    exports.stringToBase64URL = stringToBase64URL;
    exports.stringFromBase64URL = stringFromBase64URL;
    exports.codepointToUTF8 = codepointToUTF8;
    exports.stringToUTF8 = stringToUTF8;
    exports.stringFromUTF8 = stringFromUTF8;
    exports.base64UrlToUint8Array = base64UrlToUint8Array;
    exports.stringToUint8Array = stringToUint8Array;
    exports.bytesToBase64URL = bytesToBase64URL;
    var TO_BASE64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split("");
    var IGNORE_BASE64URL = " 	\n\r=".split("");
    var FROM_BASE64URL = (() => {
      const charMap = new Array(128);
      for (let i = 0; i < charMap.length; i += 1) {
        charMap[i] = -1;
      }
      for (let i = 0; i < IGNORE_BASE64URL.length; i += 1) {
        charMap[IGNORE_BASE64URL[i].charCodeAt(0)] = -2;
      }
      for (let i = 0; i < TO_BASE64URL.length; i += 1) {
        charMap[TO_BASE64URL[i].charCodeAt(0)] = i;
      }
      return charMap;
    })();
    function byteToBase64URL(byte, state, emit) {
      if (byte !== null) {
        state.queue = state.queue << 8 | byte;
        state.queuedBits += 8;
        while (state.queuedBits >= 6) {
          const pos = state.queue >> state.queuedBits - 6 & 63;
          emit(TO_BASE64URL[pos]);
          state.queuedBits -= 6;
        }
      } else if (state.queuedBits > 0) {
        state.queue = state.queue << 6 - state.queuedBits;
        state.queuedBits = 6;
        while (state.queuedBits >= 6) {
          const pos = state.queue >> state.queuedBits - 6 & 63;
          emit(TO_BASE64URL[pos]);
          state.queuedBits -= 6;
        }
      }
    }
    function byteFromBase64URL(charCode, state, emit) {
      const bits = FROM_BASE64URL[charCode];
      if (bits > -1) {
        state.queue = state.queue << 6 | bits;
        state.queuedBits += 6;
        while (state.queuedBits >= 8) {
          emit(state.queue >> state.queuedBits - 8 & 255);
          state.queuedBits -= 8;
        }
      } else if (bits === -2) {
        return;
      } else {
        throw new Error(`Invalid Base64-URL character "${String.fromCharCode(charCode)}"`);
      }
    }
    function stringToBase64URL(str2) {
      const base64 = [];
      const emitter = (char) => {
        base64.push(char);
      };
      const state = { queue: 0, queuedBits: 0 };
      stringToUTF8(str2, (byte) => {
        byteToBase64URL(byte, state, emitter);
      });
      byteToBase64URL(null, state, emitter);
      return base64.join("");
    }
    function stringFromBase64URL(str2) {
      const conv = [];
      const utf8Emit = (codepoint) => {
        conv.push(String.fromCodePoint(codepoint));
      };
      const utf8State = {
        utf8seq: 0,
        codepoint: 0
      };
      const b64State = { queue: 0, queuedBits: 0 };
      const byteEmit = (byte) => {
        stringFromUTF8(byte, utf8State, utf8Emit);
      };
      for (let i = 0; i < str2.length; i += 1) {
        byteFromBase64URL(str2.charCodeAt(i), b64State, byteEmit);
      }
      return conv.join("");
    }
    function codepointToUTF8(codepoint, emit) {
      if (codepoint <= 127) {
        emit(codepoint);
        return;
      } else if (codepoint <= 2047) {
        emit(192 | codepoint >> 6);
        emit(128 | codepoint & 63);
        return;
      } else if (codepoint <= 65535) {
        emit(224 | codepoint >> 12);
        emit(128 | codepoint >> 6 & 63);
        emit(128 | codepoint & 63);
        return;
      } else if (codepoint <= 1114111) {
        emit(240 | codepoint >> 18);
        emit(128 | codepoint >> 12 & 63);
        emit(128 | codepoint >> 6 & 63);
        emit(128 | codepoint & 63);
        return;
      }
      throw new Error(`Unrecognized Unicode codepoint: ${codepoint.toString(16)}`);
    }
    function stringToUTF8(str2, emit) {
      for (let i = 0; i < str2.length; i += 1) {
        let codepoint = str2.charCodeAt(i);
        if (codepoint > 55295 && codepoint <= 56319) {
          const highSurrogate = (codepoint - 55296) * 1024 & 65535;
          const lowSurrogate = str2.charCodeAt(i + 1) - 56320 & 65535;
          codepoint = (lowSurrogate | highSurrogate) + 65536;
          i += 1;
        }
        codepointToUTF8(codepoint, emit);
      }
    }
    function stringFromUTF8(byte, state, emit) {
      if (state.utf8seq === 0) {
        if (byte <= 127) {
          emit(byte);
          return;
        }
        for (let leadingBit = 1; leadingBit < 6; leadingBit += 1) {
          if ((byte >> 7 - leadingBit & 1) === 0) {
            state.utf8seq = leadingBit;
            break;
          }
        }
        if (state.utf8seq === 2) {
          state.codepoint = byte & 31;
        } else if (state.utf8seq === 3) {
          state.codepoint = byte & 15;
        } else if (state.utf8seq === 4) {
          state.codepoint = byte & 7;
        } else {
          throw new Error("Invalid UTF-8 sequence");
        }
        state.utf8seq -= 1;
      } else if (state.utf8seq > 0) {
        if (byte <= 127) {
          throw new Error("Invalid UTF-8 sequence");
        }
        state.codepoint = state.codepoint << 6 | byte & 63;
        state.utf8seq -= 1;
        if (state.utf8seq === 0) {
          emit(state.codepoint);
        }
      }
    }
    function base64UrlToUint8Array(str2) {
      const result = [];
      const state = { queue: 0, queuedBits: 0 };
      const onByte = (byte) => {
        result.push(byte);
      };
      for (let i = 0; i < str2.length; i += 1) {
        byteFromBase64URL(str2.charCodeAt(i), state, onByte);
      }
      return new Uint8Array(result);
    }
    function stringToUint8Array(str2) {
      const result = [];
      stringToUTF8(str2, (byte) => result.push(byte));
      return new Uint8Array(result);
    }
    function bytesToBase64URL(bytes) {
      const result = [];
      const state = { queue: 0, queuedBits: 0 };
      const onChar = (char) => {
        result.push(char);
      };
      bytes.forEach((byte) => byteToBase64URL(byte, state, onChar));
      byteToBase64URL(null, state, onChar);
      return result.join("");
    }
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/helpers.js
var require_helpers = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/helpers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pkceVerifierSlotKey = exports.Deferred = exports.removeItemAsync = exports.getItemAsync = exports.setItemAsync = exports.looksLikeFetchResponse = exports.resolveFetch = exports.supportsLocalStorage = exports.isBrowser = void 0;
    exports.expiresAt = expiresAt;
    exports.generateCallbackId = generateCallbackId;
    exports.parseParametersFromURL = parseParametersFromURL;
    exports.decodeJWT = decodeJWT;
    exports.sleep = sleep;
    exports.retryable = retryable;
    exports.generatePKCEVerifier = generatePKCEVerifier;
    exports.generatePKCEChallenge = generatePKCEChallenge;
    exports.validatePKCEFlowId = validatePKCEFlowId;
    exports.generatePKCEFlowId = generatePKCEFlowId;
    exports.storePKCEVerifier = storePKCEVerifier;
    exports.retrievePKCEVerifier = retrievePKCEVerifier;
    exports.removePKCEVerifier = removePKCEVerifier;
    exports.removeAllPKCEVerifiers = removeAllPKCEVerifiers;
    exports.appendFlowIdToRedirectTo = appendFlowIdToRedirectTo;
    exports.getCodeChallengeAndMethod = getCodeChallengeAndMethod;
    exports.parseResponseAPIVersion = parseResponseAPIVersion;
    exports.validateExp = validateExp;
    exports.getAlgorithm = getAlgorithm;
    exports.validateUUID = validateUUID;
    exports.assertRecoveryCodesExperimentalEnabled = assertRecoveryCodesExperimentalEnabled;
    exports.userNotAvailableProxy = userNotAvailableProxy;
    exports.insecureUserWarningProxy = insecureUserWarningProxy;
    exports.deepClone = deepClone;
    var constants_1 = require_constants();
    var errors_1 = require_errors();
    var base64url_1 = require_base64url();
    function expiresAt(expiresIn) {
      const timeNow = Math.round(Date.now() / 1e3);
      return timeNow + expiresIn;
    }
    function generateCallbackId() {
      return /* @__PURE__ */ Symbol("auth-callback");
    }
    var isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";
    exports.isBrowser = isBrowser;
    var localStorageWriteTests = {
      tested: false,
      writable: false
    };
    var supportsLocalStorage = () => {
      if (!(0, exports.isBrowser)()) {
        return false;
      }
      try {
        if (typeof globalThis.localStorage !== "object") {
          return false;
        }
      } catch (e) {
        return false;
      }
      if (localStorageWriteTests.tested) {
        return localStorageWriteTests.writable;
      }
      const randomKey = `lswt-${Math.random()}${Math.random()}`;
      try {
        globalThis.localStorage.setItem(randomKey, randomKey);
        globalThis.localStorage.removeItem(randomKey);
        localStorageWriteTests.tested = true;
        localStorageWriteTests.writable = true;
      } catch (e) {
        localStorageWriteTests.tested = true;
        localStorageWriteTests.writable = false;
      }
      return localStorageWriteTests.writable;
    };
    exports.supportsLocalStorage = supportsLocalStorage;
    function parseParametersFromURL(href) {
      const result = {};
      const url = new URL(href);
      if (url.hash && url.hash[0] === "#") {
        try {
          const hashSearchParams = new URLSearchParams(url.hash.substring(1));
          hashSearchParams.forEach((value, key) => {
            result[key] = value;
          });
        } catch (_e) {
        }
      }
      url.searchParams.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }
    var resolveFetch = (customFetch) => {
      if (customFetch) {
        return (...args) => customFetch(...args);
      }
      return (...args) => fetch(...args);
    };
    exports.resolveFetch = resolveFetch;
    var looksLikeFetchResponse = (maybeResponse) => {
      return typeof maybeResponse === "object" && maybeResponse !== null && "status" in maybeResponse && "ok" in maybeResponse && "json" in maybeResponse && typeof maybeResponse.json === "function";
    };
    exports.looksLikeFetchResponse = looksLikeFetchResponse;
    var setItemAsync = async (storage, key, data) => {
      await storage.setItem(key, JSON.stringify(data));
    };
    exports.setItemAsync = setItemAsync;
    var getItemAsync = async (storage, key) => {
      const value = await storage.getItem(key);
      if (!value) {
        return null;
      }
      try {
        return JSON.parse(value);
      } catch (_a) {
        return null;
      }
    };
    exports.getItemAsync = getItemAsync;
    var removeItemAsync = async (storage, key) => {
      await storage.removeItem(key);
    };
    exports.removeItemAsync = removeItemAsync;
    var Deferred = class _Deferred {
      constructor() {
        ;
        this.promise = new _Deferred.promiseConstructor((res, rej) => {
          ;
          this.resolve = res;
          this.reject = rej;
        });
      }
    };
    exports.Deferred = Deferred;
    Deferred.promiseConstructor = Promise;
    function decodeJWT(token) {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new errors_1.AuthInvalidJwtError("Invalid JWT structure");
      }
      for (let i = 0; i < parts.length; i++) {
        if (!constants_1.BASE64URL_REGEX.test(parts[i])) {
          throw new errors_1.AuthInvalidJwtError("JWT not in base64url format");
        }
      }
      const data = {
        // using base64url lib
        header: JSON.parse((0, base64url_1.stringFromBase64URL)(parts[0])),
        payload: JSON.parse((0, base64url_1.stringFromBase64URL)(parts[1])),
        signature: (0, base64url_1.base64UrlToUint8Array)(parts[2]),
        raw: {
          header: parts[0],
          payload: parts[1]
        }
      };
      return data;
    }
    async function sleep(time) {
      return await new Promise((accept) => {
        setTimeout(() => accept(null), time);
      });
    }
    function retryable(fn, isRetryable) {
      const promise = new Promise((accept, reject) => {
        ;
        (async () => {
          for (let attempt = 0; attempt < Infinity; attempt++) {
            try {
              const result = await fn(attempt);
              if (!isRetryable(attempt, null, result)) {
                accept(result);
                return;
              }
            } catch (e) {
              if (!isRetryable(attempt, e)) {
                reject(e);
                return;
              }
            }
          }
        })();
      });
      return promise;
    }
    function dec2hex(dec) {
      return ("0" + dec.toString(16)).substr(-2);
    }
    function generatePKCEVerifier() {
      const verifierLength = 56;
      const array = new Uint32Array(verifierLength);
      if (typeof crypto === "undefined") {
        const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
        const charSetLen = charSet.length;
        let verifier = "";
        for (let i = 0; i < verifierLength; i++) {
          verifier += charSet.charAt(Math.floor(Math.random() * charSetLen));
        }
        return verifier;
      }
      crypto.getRandomValues(array);
      return Array.from(array, dec2hex).join("");
    }
    async function sha2562(randomString) {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(randomString);
      const hash = await crypto.subtle.digest("SHA-256", encodedData);
      const bytes = new Uint8Array(hash);
      return Array.from(bytes).map((c) => String.fromCharCode(c)).join("");
    }
    async function generatePKCEChallenge(verifier) {
      const hasCryptoSupport = typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined" && typeof TextEncoder !== "undefined";
      if (!hasCryptoSupport) {
        console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256.");
        return verifier;
      }
      const hashed = await sha2562(verifier);
      return btoa(hashed).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    var PKCE_FLOW_ID_PATTERN = /^[a-zA-Z0-9_-]{8,64}$/;
    function validatePKCEFlowId(flowId) {
      return typeof flowId === "string" && PKCE_FLOW_ID_PATTERN.test(flowId) ? flowId : null;
    }
    function generatePKCEFlowId() {
      if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, dec2hex).join("");
      }
      let flowId = "";
      for (let i = 0; i < 32; i++) {
        flowId += Math.floor(Math.random() * 16).toString(16);
      }
      return flowId;
    }
    var pkceVerifierSlotKey = (storageKey, flowId) => `${storageKey}-flow-${flowId}-code-verifier`;
    exports.pkceVerifierSlotKey = pkceVerifierSlotKey;
    var pkceFlowIndexKey = (storageKey) => `${storageKey}-flows-code-verifier`;
    async function getPKCEFlowIndex(storage, storageKey) {
      const index = await (0, exports.getItemAsync)(storage, pkceFlowIndexKey(storageKey));
      return Array.isArray(index) ? index.filter((id) => validatePKCEFlowId(id) !== null) : [];
    }
    async function storePKCEVerifier(storage, storageKey, flowId, verifier, onEvictFlow) {
      await (0, exports.setItemAsync)(storage, (0, exports.pkceVerifierSlotKey)(storageKey, flowId), verifier);
      const index = (await getPKCEFlowIndex(storage, storageKey)).filter((id) => id !== flowId);
      index.push(flowId);
      while (index.length > constants_1.PKCE_MAX_CONCURRENT_FLOWS) {
        const evicted = index.shift();
        await (0, exports.removeItemAsync)(storage, (0, exports.pkceVerifierSlotKey)(storageKey, evicted));
        onEvictFlow === null || onEvictFlow === void 0 ? void 0 : onEvictFlow(evicted);
      }
      await (0, exports.setItemAsync)(storage, pkceFlowIndexKey(storageKey), index);
      await (0, exports.setItemAsync)(storage, `${storageKey}-code-verifier`, verifier);
    }
    async function retrievePKCEVerifier(storage, storageKey, flowId) {
      if (flowId) {
        const verifier2 = await (0, exports.getItemAsync)(storage, (0, exports.pkceVerifierSlotKey)(storageKey, flowId));
        return { verifier: typeof verifier2 === "string" ? verifier2 : null, flowId };
      }
      const verifier = await (0, exports.getItemAsync)(storage, `${storageKey}-code-verifier`);
      return { verifier: typeof verifier === "string" ? verifier : null, flowId: null };
    }
    async function removePKCEVerifier(storage, storageKey, flowId) {
      const legacyKey = `${storageKey}-code-verifier`;
      if (!flowId) {
        await (0, exports.removeItemAsync)(storage, legacyKey);
        return;
      }
      const slotKey = (0, exports.pkceVerifierSlotKey)(storageKey, flowId);
      const slotValue = await (0, exports.getItemAsync)(storage, slotKey);
      await (0, exports.removeItemAsync)(storage, slotKey);
      const index = await getPKCEFlowIndex(storage, storageKey);
      const remaining = index.filter((id) => id !== flowId);
      if (remaining.length !== index.length) {
        if (remaining.length > 0) {
          await (0, exports.setItemAsync)(storage, pkceFlowIndexKey(storageKey), remaining);
        } else {
          await (0, exports.removeItemAsync)(storage, pkceFlowIndexKey(storageKey));
        }
      }
      if (slotValue != null && slotValue === await (0, exports.getItemAsync)(storage, legacyKey)) {
        await (0, exports.removeItemAsync)(storage, legacyKey);
      }
    }
    async function removeAllPKCEVerifiers(storage, storageKey) {
      const index = await getPKCEFlowIndex(storage, storageKey);
      for (const flowId of index) {
        await (0, exports.removeItemAsync)(storage, (0, exports.pkceVerifierSlotKey)(storageKey, flowId));
      }
      await (0, exports.removeItemAsync)(storage, pkceFlowIndexKey(storageKey));
      await (0, exports.removeItemAsync)(storage, `${storageKey}-code-verifier`);
    }
    function appendFlowIdToRedirectTo(redirectTo, flowId) {
      const hashIndex = redirectTo.indexOf("#");
      let base = hashIndex === -1 ? redirectTo : redirectTo.slice(0, hashIndex);
      const fragment2 = hashIndex === -1 ? "" : redirectTo.slice(hashIndex);
      const queryIndex = base.indexOf("?");
      if (queryIndex !== -1) {
        const path = base.slice(0, queryIndex);
        const remaining = base.slice(queryIndex + 1).split("&").filter((pair) => pair !== "" && pair !== constants_1.PKCE_FLOW_ID_PARAM && !pair.startsWith(`${constants_1.PKCE_FLOW_ID_PARAM}=`));
        base = remaining.length > 0 ? `${path}?${remaining.join("&")}` : path;
      }
      const separator = base.includes("?") ? "&" : "?";
      return `${base}${separator}${constants_1.PKCE_FLOW_ID_PARAM}=${encodeURIComponent(flowId)}${fragment2}`;
    }
    async function getCodeChallengeAndMethod(storage, storageKey, isPasswordRecovery = false, onEvictFlow) {
      const codeVerifier = generatePKCEVerifier();
      let storedCodeVerifier = codeVerifier;
      if (isPasswordRecovery) {
        storedCodeVerifier += "/recovery";
      }
      const flowId = generatePKCEFlowId();
      await storePKCEVerifier(storage, storageKey, flowId, storedCodeVerifier, onEvictFlow);
      const codeChallenge = await generatePKCEChallenge(codeVerifier);
      const codeChallengeMethod = codeVerifier === codeChallenge ? "plain" : "s256";
      return [codeChallenge, codeChallengeMethod, flowId];
    }
    var API_VERSION_REGEX = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
    function parseResponseAPIVersion(response) {
      const apiVersion = response.headers.get(constants_1.API_VERSION_HEADER_NAME);
      if (!apiVersion) {
        return null;
      }
      if (!apiVersion.match(API_VERSION_REGEX)) {
        return null;
      }
      try {
        const date = /* @__PURE__ */ new Date(`${apiVersion}T00:00:00.0Z`);
        return date;
      } catch (_e) {
        return null;
      }
    }
    function validateExp(exp) {
      if (!exp) {
        throw new Error("Missing exp claim");
      }
      const timeNow = Math.floor(Date.now() / 1e3);
      if (exp <= timeNow) {
        throw new Error("JWT has expired");
      }
    }
    function getAlgorithm(alg) {
      switch (alg) {
        case "RS256":
          return {
            name: "RSASSA-PKCS1-v1_5",
            hash: { name: "SHA-256" }
          };
        case "ES256":
          return {
            name: "ECDSA",
            namedCurve: "P-256",
            hash: { name: "SHA-256" }
          };
        default:
          throw new Error("Invalid alg claim");
      }
    }
    var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    function validateUUID(str2) {
      if (!UUID_REGEX.test(str2)) {
        throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
      }
    }
    function assertRecoveryCodesExperimentalEnabled(experimental) {
      if (!experimental.recoveryCodes) {
        throw new Error("@supabase/auth-js: the MFA recovery codes API is experimental and disabled by default. Enable it by passing `auth: { experimental: { recoveryCodes: true } }` to createClient (or to the GoTrueClient constructor).");
      }
    }
    function userNotAvailableProxy() {
      const proxyTarget = {};
      return new Proxy(proxyTarget, {
        get: (target, prop) => {
          if (prop === "__isUserNotAvailableProxy") {
            return true;
          }
          if (typeof prop === "symbol") {
            const sProp = prop.toString();
            if (sProp === "Symbol(Symbol.toPrimitive)" || sProp === "Symbol(Symbol.toStringTag)" || sProp === "Symbol(util.inspect.custom)") {
              return void 0;
            }
          }
          throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${prop}" property of the session object is not supported. Please use getUser() instead.`);
        },
        set: (_target, prop) => {
          throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${prop}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
        },
        deleteProperty: (_target, prop) => {
          throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${prop}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
        }
      });
    }
    function insecureUserWarningProxy(user, suppressWarningRef) {
      return new Proxy(user, {
        get: (target, prop, receiver) => {
          if (prop === "__isInsecureUserWarningProxy") {
            return true;
          }
          if (typeof prop === "symbol") {
            const sProp = prop.toString();
            if (sProp === "Symbol(Symbol.toPrimitive)" || sProp === "Symbol(Symbol.toStringTag)" || sProp === "Symbol(util.inspect.custom)" || sProp === "Symbol(nodejs.util.inspect.custom)") {
              return Reflect.get(target, prop, receiver);
            }
          }
          if (!suppressWarningRef.value && typeof prop === "string") {
            console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server.");
            suppressWarningRef.value = true;
          }
          return Reflect.get(target, prop, receiver);
        }
      });
    }
    function deepClone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/fetch.js
var require_fetch = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/fetch.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.handleError = handleError;
    exports._request = _request;
    exports._sessionResponse = _sessionResponse;
    exports._sessionResponsePassword = _sessionResponsePassword;
    exports._userResponse = _userResponse;
    exports._ssoResponse = _ssoResponse;
    exports._generateLinkResponse = _generateLinkResponse;
    exports._noResolveJsonResponse = _noResolveJsonResponse;
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var constants_1 = require_constants();
    var helpers_1 = require_helpers();
    var errors_1 = require_errors();
    var _getErrorMessage = (err) => {
      if (typeof err === "object" && err !== null) {
        const e = err;
        if (typeof e.msg === "string")
          return e.msg;
        if (typeof e.message === "string")
          return e.message;
        if (typeof e.error_description === "string")
          return e.error_description;
        if (typeof e.error === "string")
          return e.error;
      }
      return JSON.stringify(err);
    };
    var NETWORK_ERROR_CODES = [
      500,
      501,
      502,
      503,
      504,
      520,
      521,
      522,
      523,
      524,
      525,
      526,
      527,
      528,
      529,
      530
    ];
    async function handleError(error) {
      var _a;
      if (!(0, helpers_1.looksLikeFetchResponse)(error)) {
        throw new errors_1.AuthRetryableFetchError(_getErrorMessage(error), 0);
      }
      let data;
      try {
        data = await error.json();
      } catch (e) {
        if (NETWORK_ERROR_CODES.includes(error.status)) {
          throw new errors_1.AuthRetryableFetchError(error.statusText || `HTTP ${error.status}`, error.status);
        }
        throw new errors_1.AuthUnknownError(_getErrorMessage(e), e);
      }
      if (NETWORK_ERROR_CODES.includes(error.status)) {
        throw new errors_1.AuthRetryableFetchError(_getErrorMessage(data), error.status);
      }
      let errorCode = void 0;
      const responseAPIVersion = (0, helpers_1.parseResponseAPIVersion)(error);
      if (responseAPIVersion && responseAPIVersion.getTime() >= constants_1.API_VERSIONS["2024-01-01"].timestamp && typeof data === "object" && data && typeof data.code === "string") {
        errorCode = data.code;
      } else if (typeof data === "object" && data && typeof data.error_code === "string") {
        errorCode = data.error_code;
      }
      if (!errorCode) {
        if (typeof data === "object" && data && typeof data.weak_password === "object" && data.weak_password && Array.isArray(data.weak_password.reasons) && data.weak_password.reasons.length && data.weak_password.reasons.reduce((a, i) => a && typeof i === "string", true)) {
          throw new errors_1.AuthWeakPasswordError(_getErrorMessage(data), error.status, data.weak_password.reasons);
        }
      } else if (errorCode === "weak_password") {
        throw new errors_1.AuthWeakPasswordError(_getErrorMessage(data), error.status, ((_a = data.weak_password) === null || _a === void 0 ? void 0 : _a.reasons) || []);
      } else if (errorCode === "session_not_found") {
        throw new errors_1.AuthSessionMissingError();
      }
      throw new errors_1.AuthApiError(_getErrorMessage(data), error.status || 500, errorCode);
    }
    var _getRequestParams = (method, options, parameters, body) => {
      const params = { method, headers: (options === null || options === void 0 ? void 0 : options.headers) || {} };
      if (method === "GET") {
        return params;
      }
      params.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, options === null || options === void 0 ? void 0 : options.headers);
      params.body = JSON.stringify(body);
      return Object.assign(Object.assign({}, params), parameters);
    };
    async function _request(fetcher, method, url, options) {
      var _a;
      const headers = Object.assign({}, options === null || options === void 0 ? void 0 : options.headers);
      if (!headers[constants_1.API_VERSION_HEADER_NAME]) {
        headers[constants_1.API_VERSION_HEADER_NAME] = constants_1.API_VERSIONS["2024-01-01"].name;
      }
      if (options === null || options === void 0 ? void 0 : options.jwt) {
        headers["Authorization"] = `Bearer ${options.jwt}`;
      }
      const qs = (_a = options === null || options === void 0 ? void 0 : options.query) !== null && _a !== void 0 ? _a : {};
      if (options === null || options === void 0 ? void 0 : options.redirectTo) {
        qs["redirect_to"] = options.redirectTo;
      }
      const queryString = Object.keys(qs).length ? "?" + new URLSearchParams(qs).toString() : "";
      const data = await _handleRequest(fetcher, method, url + queryString, {
        headers,
        noResolveJson: options === null || options === void 0 ? void 0 : options.noResolveJson
      }, {}, options === null || options === void 0 ? void 0 : options.body);
      return (options === null || options === void 0 ? void 0 : options.xform) ? options === null || options === void 0 ? void 0 : options.xform(data) : { data: Object.assign({}, data), error: null };
    }
    async function _handleRequest(fetcher, method, url, options, parameters, body) {
      const requestParams = _getRequestParams(method, options, parameters, body);
      let result;
      try {
        result = await fetcher(url, Object.assign({}, requestParams));
      } catch (e) {
        throw new errors_1.AuthRetryableFetchError(_getErrorMessage(e), 0);
      }
      if (!result.ok) {
        await handleError(result);
      }
      if (options === null || options === void 0 ? void 0 : options.noResolveJson) {
        return result;
      }
      try {
        return await result.json();
      } catch (e) {
        await handleError(e);
      }
    }
    function _sessionResponse(data) {
      var _a;
      let session = null;
      if (hasSession(data)) {
        session = Object.assign({}, data);
        if (!data.expires_at) {
          session.expires_at = (0, helpers_1.expiresAt)(data.expires_in);
        }
      }
      const user = (_a = data.user) !== null && _a !== void 0 ? _a : typeof (data === null || data === void 0 ? void 0 : data.id) === "string" ? data : null;
      return { data: { session, user }, error: null };
    }
    function _sessionResponsePassword(data) {
      const response = _sessionResponse(data);
      if (!response.error && data.weak_password && typeof data.weak_password === "object" && Array.isArray(data.weak_password.reasons) && data.weak_password.reasons.length && data.weak_password.message && typeof data.weak_password.message === "string" && data.weak_password.reasons.reduce((a, i) => a && typeof i === "string", true)) {
        response.data.weak_password = data.weak_password;
      }
      return response;
    }
    function _userResponse(data) {
      var _a;
      const user = (_a = data.user) !== null && _a !== void 0 ? _a : data;
      return { data: { user }, error: null };
    }
    function _ssoResponse(data) {
      return { data, error: null };
    }
    function _generateLinkResponse(data) {
      const { action_link, email_otp, hashed_token, redirect_to, verification_type } = data, rest = tslib_1.__rest(data, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]);
      const properties = {
        action_link,
        email_otp,
        hashed_token,
        redirect_to,
        verification_type
      };
      const user = Object.assign({}, rest);
      return {
        data: {
          properties,
          user
        },
        error: null
      };
    }
    function _noResolveJsonResponse(data) {
      return data;
    }
    function hasSession(data) {
      return !!data.access_token && !!data.refresh_token && !!data.expires_in;
    }
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/types.js
var require_types = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SIGN_OUT_SCOPES = void 0;
    exports.SIGN_OUT_SCOPES = ["global", "local", "others"];
  }
});

// node_modules/@supabase/auth-js/dist/main/GoTrueAdminApi.js
var require_GoTrueAdminApi = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/GoTrueAdminApi.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var fetch_1 = require_fetch();
    var helpers_1 = require_helpers();
    var types_1 = require_types();
    var errors_1 = require_errors();
    var GoTrueAdminApi = class {
      /**
       * Creates an admin API client that can be used to manage users and OAuth clients.
       *
       * @example Using supabase-js (recommended)
       * ```ts
       * import { createClient } from '@supabase/supabase-js'
       *
       * const supabase = createClient('https://xyzcompany.supabase.co', 'your-secret-key')
       * const { data, error } = await supabase.auth.admin.listUsers()
       * ```
       *
       * @example Standalone import for bundle-sensitive environments
       * ```ts
       * import { GoTrueAdminApi } from '@supabase/auth-js'
       *
       * const admin = new GoTrueAdminApi({
       *   url: 'https://xyzcompany.supabase.co/auth/v1',
       *   headers: { Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}` },
       * })
       * ```
       */
      constructor({ url = "", headers = {}, fetch: fetch3, experimental }) {
        this.url = url;
        this.headers = headers;
        this.fetch = (0, helpers_1.resolveFetch)(fetch3);
        this.experimental = experimental !== null && experimental !== void 0 ? experimental : {};
        this.mfa = {
          listFactors: this._listFactors.bind(this),
          deleteFactor: this._deleteFactor.bind(this)
        };
        this.oauth = {
          listClients: this._listOAuthClients.bind(this),
          createClient: this._createOAuthClient.bind(this),
          getClient: this._getOAuthClient.bind(this),
          updateClient: this._updateOAuthClient.bind(this),
          deleteClient: this._deleteOAuthClient.bind(this),
          regenerateClientSecret: this._regenerateOAuthClientSecret.bind(this)
        };
        this.customProviders = {
          listProviders: this._listCustomProviders.bind(this),
          createProvider: this._createCustomProvider.bind(this),
          getProvider: this._getCustomProvider.bind(this),
          updateProvider: this._updateCustomProvider.bind(this),
          deleteProvider: this._deleteCustomProvider.bind(this)
        };
        this.passkey = {
          listPasskeys: this._adminListPasskeys.bind(this),
          deletePasskey: this._adminDeletePasskey.bind(this)
        };
      }
      /**
       * Removes a logged-in session.
       * @param jwt A valid, logged-in JWT.
       * @param scope The logout sope.
       *
       * @category Auth
       * @subcategory Auth Admin
       */
      async signOut(jwt, scope = types_1.SIGN_OUT_SCOPES[0]) {
        if (types_1.SIGN_OUT_SCOPES.indexOf(scope) < 0) {
          throw new Error(`@supabase/auth-js: Parameter scope must be one of ${types_1.SIGN_OUT_SCOPES.join(", ")}`);
        }
        try {
          await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/logout?scope=${scope}`, {
            headers: this.headers,
            jwt,
            noResolveJson: true
          });
          return { data: null, error: null };
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**
       * Sends an invite link to an email address.
       * @param email The email address of the user.
       * @param options Additional options to be included when inviting.
       *
       * @category Auth
       * @subcategory Auth Admin
       *
       * @remarks
       * - Sends an invite link to the user's email address.
       * - The `inviteUserByEmail()` method is typically used by administrators to invite users to join the application.
       * - Note that PKCE is not supported when using `inviteUserByEmail`. This is because the browser initiating the invite is often different from the browser accepting the invite which makes it difficult to provide the security guarantees required of the PKCE flow.
       *
       * @example Invite a user
       * ```js
       * const { data, error } = await supabase.auth.admin.inviteUserByEmail('email@example.com')
       * ```
       *
       * @exampleResponse Invite a user
       * ```json
       * {
       *   "data": {
       *     "user": {
       *       "id": "11111111-1111-1111-1111-111111111111",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "email": "example@email.com",
       *       "invited_at": "2024-01-01T00:00:00Z",
       *       "phone": "",
       *       "confirmation_sent_at": "2024-01-01T00:00:00Z",
       *       "app_metadata": {
       *         "provider": "email",
       *         "providers": [
       *           "email"
       *         ]
       *       },
       *       "user_metadata": {},
       *       "identities": [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "11111111-1111-1111-1111-111111111111",
       *           "user_id": "11111111-1111-1111-1111-111111111111",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": false,
       *             "phone_verified": false,
       *             "sub": "11111111-1111-1111-1111-111111111111"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "example@email.com"
       *         }
       *       ],
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z",
       *       "is_anonymous": false
       *     }
       *   },
       *   "error": null
       * }
       * ```
       */
      async inviteUserByEmail(email, options = {}) {
        try {
          return await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/invite`, {
            body: { email, data: options.data },
            headers: this.headers,
            redirectTo: options.redirectTo,
            xform: fetch_1._userResponse
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: { user: null }, error };
          }
          throw error;
        }
      }
      /**
       * Generates email links and OTPs to be sent via a custom email provider.
       * @param params The parameters for generating the link, including the link `type`, the user's `email`, and type-specific options such as `password`, `data`, and `redirectTo`.
       *
       * @category Auth
       * @subcategory Auth Admin
       *
       * @remarks
       * - The following types can be passed into `generateLink()`: `signup`, `magiclink`, `invite`, `recovery`, `email_change_current`, `email_change_new`, `phone_change`.
       * - `generateLink()` only generates the email link for `email_change_email` if the **Secure email change** is enabled in your project's [email auth provider settings](/dashboard/project/_/auth/providers).
       * - `generateLink()` handles the creation of the user for `signup`, `invite` and `magiclink`.
       *
       * @example Generate a signup link
       * ```js
       * const { data, error } = await supabase.auth.admin.generateLink({
       *   type: 'signup',
       *   email: 'email@example.com',
       *   password: 'secret'
       * })
       * ```
       *
       * @exampleResponse Generate a signup link
       * ```json
       * {
       *   "data": {
       *     "properties": {
       *       "action_link": "<LINK_TO_SEND_TO_USER>",
       *       "email_otp": "999999",
       *       "hashed_token": "<HASHED_TOKEN",
       *       "redirect_to": "<REDIRECT_URL>",
       *       "verification_type": "signup"
       *     },
       *     "user": {
       *       "id": "11111111-1111-1111-1111-111111111111",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "email": "email@example.com",
       *       "phone": "",
       *       "confirmation_sent_at": "2024-01-01T00:00:00Z",
       *       "app_metadata": {
       *         "provider": "email",
       *         "providers": [
       *           "email"
       *         ]
       *       },
       *       "user_metadata": {},
       *       "identities": [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "11111111-1111-1111-1111-111111111111",
       *           "user_id": "11111111-1111-1111-1111-111111111111",
       *           "identity_data": {
       *             "email": "email@example.com",
       *             "email_verified": false,
       *             "phone_verified": false,
       *             "sub": "11111111-1111-1111-1111-111111111111"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "email@example.com"
       *         }
       *       ],
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z",
       *       "is_anonymous": false
       *     }
       *   },
       *   "error": null
       * }
       * ```
       *
       * @example Generate an invite link
       * ```js
       * const { data, error } = await supabase.auth.admin.generateLink({
       *   type: 'invite',
       *   email: 'email@example.com'
       * })
       * ```
       *
       * @example Generate a magic link
       * ```js
       * const { data, error } = await supabase.auth.admin.generateLink({
       *   type: 'magiclink',
       *   email: 'email@example.com'
       * })
       * ```
       *
       * @example Generate a recovery link
       * ```js
       * const { data, error } = await supabase.auth.admin.generateLink({
       *   type: 'recovery',
       *   email: 'email@example.com'
       * })
       * ```
       *
       * @example Generate links to change current email address
       * ```js
       * // generate an email change link to be sent to the current email address
       * const { data, error } = await supabase.auth.admin.generateLink({
       *   type: 'email_change_current',
       *   email: 'current.email@example.com',
       *   newEmail: 'new.email@example.com'
       * })
       *
       * // generate an email change link to be sent to the new email address
       * const { data, error } = await supabase.auth.admin.generateLink({
       *   type: 'email_change_new',
       *   email: 'current.email@example.com',
       *   newEmail: 'new.email@example.com'
       * })
       * ```
       */
      async generateLink(params) {
        try {
          const { options } = params, rest = tslib_1.__rest(params, ["options"]);
          const body = Object.assign(Object.assign({}, rest), options);
          if ("newEmail" in rest) {
            body.new_email = rest === null || rest === void 0 ? void 0 : rest.newEmail;
            delete body["newEmail"];
          }
          return await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/admin/generate_link`, {
            body,
            headers: this.headers,
            xform: fetch_1._generateLinkResponse,
            redirectTo: options === null || options === void 0 ? void 0 : options.redirectTo
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return {
              data: {
                properties: null,
                user: null
              },
              error
            };
          }
          throw error;
        }
      }
      // User Admin API
      /**
       * Creates a new user.
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       *
       * @category Auth
       * @subcategory Auth Admin
       *
       * @remarks
       * - To confirm the user's email address or phone number, set `email_confirm` or `phone_confirm` to true. Both arguments default to false.
       * - `createUser()` will not send a confirmation email to the user. You can use [`inviteUserByEmail()`](/docs/reference/javascript/auth-admin-inviteuserbyemail) if you want to send them an email invite instead.
       * - If you are sure that the created user's email or phone number is legitimate and verified, you can set the `email_confirm` or `phone_confirm` param to `true`.
       *
       * @example With custom user metadata
       * ```js
       * const { data, error } = await supabase.auth.admin.createUser({
       *   email: 'user@email.com',
       *   password: 'password',
       *   user_metadata: { name: 'Yoda' }
       * })
       * ```
       *
       * @exampleResponse With custom user metadata
       * ```json
       * {
       *   data: {
       *     user: {
       *       id: '1',
       *       aud: 'authenticated',
       *       role: 'authenticated',
       *       email: 'example@email.com',
       *       email_confirmed_at: '2024-01-01T00:00:00Z',
       *       phone: '',
       *       confirmation_sent_at: '2024-01-01T00:00:00Z',
       *       confirmed_at: '2024-01-01T00:00:00Z',
       *       last_sign_in_at: '2024-01-01T00:00:00Z',
       *       app_metadata: {},
       *       user_metadata: {},
       *       identities: [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "1",
       *           "user_id": "1",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": true,
       *             "phone_verified": false,
       *             "sub": "1"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "email@example.com"
       *         },
       *       ],
       *       created_at: '2024-01-01T00:00:00Z',
       *       updated_at: '2024-01-01T00:00:00Z',
       *       is_anonymous: false,
       *     }
       *   }
       *   error: null
       * }
       * ```
       *
       * @example Auto-confirm the user's email
       * ```js
       * const { data, error } = await supabase.auth.admin.createUser({
       *   email: 'user@email.com',
       *   email_confirm: true
       * })
       * ```
       *
       * @example Auto-confirm the user's phone number
       * ```js
       * const { data, error } = await supabase.auth.admin.createUser({
       *   phone: '1234567890',
       *   phone_confirm: true
       * })
       * ```
       */
      async createUser(attributes) {
        try {
          return await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/admin/users`, {
            body: attributes,
            headers: this.headers,
            xform: fetch_1._userResponse
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: { user: null }, error };
          }
          throw error;
        }
      }
      /**
       * Get a list of users.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       * @param params An object which supports `page` and `perPage` as numbers, to alter the paginated results.
       *
       * @category Auth
       * @subcategory Auth Admin
       *
       * @remarks
       * - Defaults to return 50 users per page.
       *
       * @example Get a page of users
       * ```js
       * const { data: { users }, error } = await supabase.auth.admin.listUsers()
       * ```
       *
       * @example Paginated list of users
       * ```js
       * const { data: { users }, error } = await supabase.auth.admin.listUsers({
       *   page: 1,
       *   perPage: 1000
       * })
       * ```
       */
      async listUsers(params) {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
          const pagination = { nextPage: null, lastPage: 0, total: 0 };
          const response = await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/admin/users`, {
            headers: this.headers,
            noResolveJson: true,
            query: {
              page: (_b = (_a = params === null || params === void 0 ? void 0 : params.page) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "",
              per_page: (_d = (_c = params === null || params === void 0 ? void 0 : params.perPage) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""
            },
            xform: fetch_1._noResolveJsonResponse
          });
          if (response.error)
            throw response.error;
          const users = await response.json();
          const total = (_e = response.headers.get("x-total-count")) !== null && _e !== void 0 ? _e : 0;
          const links = (_g = (_f = response.headers.get("link")) === null || _f === void 0 ? void 0 : _f.split(",")) !== null && _g !== void 0 ? _g : [];
          if (links.length > 0) {
            links.forEach((link) => {
              const page = parseInt(link.split(";")[0].split("=")[1].substring(0, 1));
              const rel = JSON.parse(link.split(";")[1].split("=")[1]);
              pagination[`${rel}Page`] = page;
            });
            pagination.total = parseInt(total);
          }
          return { data: Object.assign(Object.assign({}, users), pagination), error: null };
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: { users: [] }, error };
          }
          throw error;
        }
      }
      /**
       * Get user by id.
       *
       * @param uid The user's unique identifier
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       *
       * @category Auth
       * @subcategory Auth Admin
       *
       * @remarks
       * - Fetches the user object from the database based on the user's id.
       * - The `getUserById()` method requires the user's id which maps to the `auth.users.id` column.
       *
       * @example Fetch the user object using the access_token jwt
       * ```js
       * const { data, error } = await supabase.auth.admin.getUserById(1)
       * ```
       *
       * @exampleResponse Fetch the user object using the access_token jwt
       * ```json
       * {
       *   data: {
       *     user: {
       *       id: '1',
       *       aud: 'authenticated',
       *       role: 'authenticated',
       *       email: 'example@email.com',
       *       email_confirmed_at: '2024-01-01T00:00:00Z',
       *       phone: '',
       *       confirmation_sent_at: '2024-01-01T00:00:00Z',
       *       confirmed_at: '2024-01-01T00:00:00Z',
       *       last_sign_in_at: '2024-01-01T00:00:00Z',
       *       app_metadata: {},
       *       user_metadata: {},
       *       identities: [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "1",
       *           "user_id": "1",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": true,
       *             "phone_verified": false,
       *             "sub": "1"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "email@example.com"
       *         },
       *       ],
       *       created_at: '2024-01-01T00:00:00Z',
       *       updated_at: '2024-01-01T00:00:00Z',
       *       is_anonymous: false,
       *     }
       *   }
       *   error: null
       * }
       * ```
       */
      async getUserById(uid2) {
        (0, helpers_1.validateUUID)(uid2);
        try {
          return await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/admin/users/${uid2}`, {
            headers: this.headers,
            xform: fetch_1._userResponse
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: { user: null }, error };
          }
          throw error;
        }
      }
      /**
       * Updates the user data. Changes are applied directly without confirmation flows.
       *
       * @param uid The user's unique identifier
       * @param attributes The data you want to update.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       *
       * @remarks
       * **Important:** This is a server-side operation and does **not** trigger client-side
       * `onAuthStateChange` listeners. The admin API has no connection to client state.
       *
       * To sync changes to the client after calling this method:
       * 1. On the client, call `supabase.auth.refreshSession()` to fetch the updated user data
       * 2. This will trigger the `TOKEN_REFRESHED` event and notify all listeners
       *
       * @example
       * ```typescript
       * // Server-side (Edge Function)
       * const { data, error } = await supabase.auth.admin.updateUserById(
       *   userId,
       *   { user_metadata: { preferences: { theme: 'dark' } } }
       * )
       *
       * // Client-side (to sync the changes)
       * const { data, error } = await supabase.auth.refreshSession()
       * // onAuthStateChange listeners will now be notified with updated user
       * ```
       *
       * @see {@link GoTrueClient.refreshSession} for syncing admin changes to the client
       * @see {@link GoTrueClient.updateUser} for client-side user updates (triggers listeners automatically)
       *
       * @category Auth
       * @subcategory Auth Admin
       *
       * @example Updates a user's email
       * ```js
       * const { data: user, error } = await supabase.auth.admin.updateUserById(
       *   '11111111-1111-1111-1111-111111111111',
       *   { email: 'new@email.com' }
       * )
       * ```
       *
       * @exampleResponse Updates a user's email
       * ```json
       * {
       *   "data": {
       *     "user": {
       *       "id": "11111111-1111-1111-1111-111111111111",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "email": "new@email.com",
       *       "email_confirmed_at": "2024-01-01T00:00:00Z",
       *       "phone": "",
       *       "confirmed_at": "2024-01-01T00:00:00Z",
       *       "recovery_sent_at": "2024-01-01T00:00:00Z",
       *       "last_sign_in_at": "2024-01-01T00:00:00Z",
       *       "app_metadata": {
       *         "provider": "email",
       *         "providers": [
       *           "email"
       *         ]
       *       },
       *       "user_metadata": {
       *         "email": "example@email.com",
       *         "email_verified": false,
       *         "phone_verified": false,
       *         "sub": "11111111-1111-1111-1111-111111111111"
       *       },
       *       "identities": [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "11111111-1111-1111-1111-111111111111",
       *           "user_id": "11111111-1111-1111-1111-111111111111",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": false,
       *             "phone_verified": false,
       *             "sub": "11111111-1111-1111-1111-111111111111"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "example@email.com"
       *         }
       *       ],
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z",
       *       "is_anonymous": false
       *     }
       *   },
       *   "error": null
       * }
       * ```
       *
       * @example Updates a user's password
       * ```js
       * const { data: user, error } = await supabase.auth.admin.updateUserById(
       *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
       *   { password: 'new_password' }
       * )
       * ```
       *
       * @example Updates a user's metadata
       * ```js
       * const { data: user, error } = await supabase.auth.admin.updateUserById(
       *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
       *   { user_metadata: { hello: 'world' } }
       * )
       * ```
       *
       * @example Updates a user's app_metadata
       * ```js
       * const { data: user, error } = await supabase.auth.admin.updateUserById(
       *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
       *   { app_metadata: { plan: 'trial' } }
       * )
       * ```
       *
       * @example Confirms a user's email address
       * ```js
       * const { data: user, error } = await supabase.auth.admin.updateUserById(
       *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
       *   { email_confirm: true }
       * )
       * ```
       *
       * @example Confirms a user's phone number
       * ```js
       * const { data: user, error } = await supabase.auth.admin.updateUserById(
       *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
       *   { phone_confirm: true }
       * )
       * ```
       *
       * @example Ban a user for 100 years
       * ```js
       * const { data: user, error } = await supabase.auth.admin.updateUserById(
       *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
       *   { ban_duration: '876000h' }
       * )
       * ```
       */
      async updateUserById(uid2, attributes) {
        (0, helpers_1.validateUUID)(uid2);
        try {
          return await (0, fetch_1._request)(this.fetch, "PUT", `${this.url}/admin/users/${uid2}`, {
            body: attributes,
            headers: this.headers,
            xform: fetch_1._userResponse
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: { user: null }, error };
          }
          throw error;
        }
      }
      /**
       * Delete a user. Requires a `service_role` key.
       * Returns the user that was deleted. In cases of concurrent updates, the user object returned
       * might not accurately reflect the user information at the time of deletion.
       *
       * @param id The user id you want to remove.
       * @param shouldSoftDelete If true, then the user will be soft-deleted from the auth schema. Soft deletion allows user identification from the hashed user ID but is not reversible.
       * Defaults to false for backward compatibility.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       *
       * @category Auth
       * @subcategory Auth Admin
       *
       * @remarks
       * - The `deleteUser()` method requires the user's ID, which maps to the `auth.users.id` column.
       *
       * @example Removes a user
       * ```js
       * const { data, error } = await supabase.auth.admin.deleteUser(
       *   '715ed5db-f090-4b8c-a067-640ecee36aa0'
       * )
       * ```
       *
       * @exampleResponse Removes a user
       * ```json
       * {
       *   "data": {
       *     "user": {
       *       "id": "715ed5db-f090-4b8c-a067-640ecee36aa0",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "email": "example@email.com",
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z"
       *     }
       *   },
       *   "error": null
       * }
       * ```
       */
      async deleteUser(id, shouldSoftDelete = false) {
        (0, helpers_1.validateUUID)(id);
        try {
          const { data, error } = await this.getUserById(id);
          if (error) {
            return { data: { user: null }, error };
          }
          await (0, fetch_1._request)(this.fetch, "DELETE", `${this.url}/admin/users/${id}`, {
            headers: this.headers,
            body: {
              should_soft_delete: shouldSoftDelete
            },
            noResolveJson: true
          });
          return { data, error: null };
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: { user: null }, error };
          }
          throw error;
        }
      }
      async _listFactors(params) {
        (0, helpers_1.validateUUID)(params.userId);
        try {
          const { data, error } = await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/admin/users/${params.userId}/factors`, {
            headers: this.headers,
            xform: (factors) => {
              return { data: { factors }, error: null };
            }
          });
          return { data, error };
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      async _deleteFactor(params) {
        (0, helpers_1.validateUUID)(params.userId);
        (0, helpers_1.validateUUID)(params.id);
        try {
          const data = await (0, fetch_1._request)(this.fetch, "DELETE", `${this.url}/admin/users/${params.userId}/factors/${params.id}`, {
            headers: this.headers
          });
          return { data, error: null };
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**
       * Lists all OAuth clients with optional pagination.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _listOAuthClients(params) {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
          const pagination = { nextPage: null, lastPage: 0, total: 0 };
          const response = await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/admin/oauth/clients`, {
            headers: this.headers,
            noResolveJson: true,
            query: {
              page: (_b = (_a = params === null || params === void 0 ? void 0 : params.page) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "",
              per_page: (_d = (_c = params === null || params === void 0 ? void 0 : params.perPage) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""
            },
            xform: fetch_1._noResolveJsonResponse
          });
          if (response.error)
            throw response.error;
          const clients = await response.json();
          const total = (_e = response.headers.get("x-total-count")) !== null && _e !== void 0 ? _e : 0;
          const links = (_g = (_f = response.headers.get("link")) === null || _f === void 0 ? void 0 : _f.split(",")) !== null && _g !== void 0 ? _g : [];
          if (links.length > 0) {
            links.forEach((link) => {
              const page = parseInt(link.split(";")[0].split("=")[1].substring(0, 1));
              const rel = JSON.parse(link.split(";")[1].split("=")[1]);
              pagination[`${rel}Page`] = page;
            });
            pagination.total = parseInt(total);
          }
          return { data: Object.assign(Object.assign({}, clients), pagination), error: null };
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: { clients: [] }, error };
          }
          throw error;
        }
      }
      /**
       * Creates a new OAuth client.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _createOAuthClient(params) {
        try {
          return await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/admin/oauth/clients`, {
            body: params,
            headers: this.headers,
            xform: (client) => {
              return { data: client, error: null };
            }
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**
       * Gets details of a specific OAuth client.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _getOAuthClient(clientId) {
        try {
          return await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/admin/oauth/clients/${clientId}`, {
            headers: this.headers,
            xform: (client) => {
              return { data: client, error: null };
            }
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**
       * Updates an existing OAuth client.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _updateOAuthClient(clientId, params) {
        try {
          return await (0, fetch_1._request)(this.fetch, "PUT", `${this.url}/admin/oauth/clients/${clientId}`, {
            body: params,
            headers: this.headers,
            xform: (client) => {
              return { data: client, error: null };
            }
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**
       * Deletes an OAuth client.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _deleteOAuthClient(clientId) {
        try {
          await (0, fetch_1._request)(this.fetch, "DELETE", `${this.url}/admin/oauth/clients/${clientId}`, {
            headers: this.headers,
            noResolveJson: true
          });
          return { data: null, error: null };
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**
       * Regenerates the secret for an OAuth client.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _regenerateOAuthClientSecret(clientId) {
        try {
          return await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/admin/oauth/clients/${clientId}/regenerate_secret`, {
            headers: this.headers,
            xform: (client) => {
              return { data: client, error: null };
            }
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**
       * Lists all custom providers with optional type filter.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _listCustomProviders(params) {
        try {
          const query = {};
          if (params === null || params === void 0 ? void 0 : params.type) {
            query.type = params.type;
          }
          return await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/admin/custom-providers`, {
            headers: this.headers,
            query,
            xform: (data) => {
              var _a;
              return { data: { providers: (_a = data === null || data === void 0 ? void 0 : data.providers) !== null && _a !== void 0 ? _a : [] }, error: null };
            }
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: { providers: [] }, error };
          }
          throw error;
        }
      }
      /**
       * Creates a new custom OIDC/OAuth provider.
       *
       * For OIDC providers, the server fetches and validates the OpenID Connect discovery document
       * from the issuer's well-known endpoint (or the provided `discovery_url`) at creation time.
       * This may return a validation error (`error_code: "validation_failed"`) if the discovery
       * document is unreachable, not valid JSON, missing required fields, or if the issuer
       * in the document does not match the expected issuer.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _createCustomProvider(params) {
        try {
          return await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/admin/custom-providers`, {
            body: params,
            headers: this.headers,
            xform: (provider) => {
              return { data: provider, error: null };
            }
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**
       * Gets details of a specific custom provider by identifier.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _getCustomProvider(identifier) {
        try {
          return await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/admin/custom-providers/${identifier}`, {
            headers: this.headers,
            xform: (provider) => {
              return { data: provider, error: null };
            }
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**
       * Updates an existing custom provider.
       *
       * When `issuer` or `discovery_url` is changed on an OIDC provider, the server re-fetches and
       * validates the discovery document before persisting. This may return a validation error
       * (`error_code: "validation_failed"`) if the discovery document is unreachable, invalid, or
       * the issuer does not match.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _updateCustomProvider(identifier, params) {
        try {
          return await (0, fetch_1._request)(this.fetch, "PUT", `${this.url}/admin/custom-providers/${identifier}`, {
            body: params,
            headers: this.headers,
            xform: (provider) => {
              return { data: provider, error: null };
            }
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**
       * Deletes a custom provider.
       *
       * This function should only be called on a server. Never expose your `service_role` key in the browser.
       */
      async _deleteCustomProvider(identifier) {
        try {
          await (0, fetch_1._request)(this.fetch, "DELETE", `${this.url}/admin/custom-providers/${identifier}`, {
            headers: this.headers,
            noResolveJson: true
          });
          return { data: null, error: null };
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**
       * Lists all passkeys for a user.
       *
       * This function should only be called on a server. Never expose your secret key in the browser.
       */
      async _adminListPasskeys(params) {
        (0, helpers_1.validateUUID)(params.userId);
        try {
          return await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/admin/users/${params.userId}/passkeys`, { headers: this.headers, xform: (data) => ({ data, error: null }) });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**
       * Deletes a user's passkey.
       *
       * This function should only be called on a server. Never expose your secret key in the browser.
       */
      async _adminDeletePasskey(params) {
        (0, helpers_1.validateUUID)(params.userId);
        (0, helpers_1.validateUUID)(params.passkeyId);
        try {
          await (0, fetch_1._request)(this.fetch, "DELETE", `${this.url}/admin/users/${params.userId}/passkeys/${params.passkeyId}`, { headers: this.headers, noResolveJson: true });
          return { data: null, error: null };
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
    };
    exports.default = GoTrueAdminApi;
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/local-storage.js
var require_local_storage = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/local-storage.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.memoryLocalStorageAdapter = memoryLocalStorageAdapter;
    function memoryLocalStorageAdapter(store = {}) {
      return {
        getItem: (key) => {
          return store[key] || null;
        },
        setItem: (key, value) => {
          store[key] = value;
        },
        removeItem: (key) => {
          delete store[key];
        }
      };
    }
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/locks.js
var require_locks = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/locks.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProcessLockAcquireTimeoutError = exports.NavigatorLockAcquireTimeoutError = exports.LockAcquireTimeoutError = exports.internals = void 0;
    exports.navigatorLock = navigatorLock;
    exports.processLock = processLock;
    var helpers_1 = require_helpers();
    exports.internals = {
      /**
       * @experimental
       */
      debug: !!(globalThis && (0, helpers_1.supportsLocalStorage)() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
    };
    var LockAcquireTimeoutError = class extends Error {
      constructor(message) {
        super(message);
        this.isAcquireTimeout = true;
      }
    };
    exports.LockAcquireTimeoutError = LockAcquireTimeoutError;
    var NavigatorLockAcquireTimeoutError = class extends LockAcquireTimeoutError {
    };
    exports.NavigatorLockAcquireTimeoutError = NavigatorLockAcquireTimeoutError;
    var ProcessLockAcquireTimeoutError = class extends LockAcquireTimeoutError {
    };
    exports.ProcessLockAcquireTimeoutError = ProcessLockAcquireTimeoutError;
    async function navigatorLock(name, acquireTimeout, fn) {
      if (exports.internals.debug) {
        console.log("@supabase/gotrue-js: navigatorLock: acquire lock", name, acquireTimeout);
      }
      const abortController = new globalThis.AbortController();
      let acquireTimeoutTimer;
      if (acquireTimeout > 0) {
        acquireTimeoutTimer = setTimeout(() => {
          abortController.abort();
          if (exports.internals.debug) {
            console.log("@supabase/gotrue-js: navigatorLock acquire timed out", name);
          }
        }, acquireTimeout);
      }
      await Promise.resolve();
      try {
        return await globalThis.navigator.locks.request(name, acquireTimeout === 0 ? {
          mode: "exclusive",
          ifAvailable: true
        } : {
          mode: "exclusive",
          signal: abortController.signal
        }, async (lock) => {
          if (lock) {
            clearTimeout(acquireTimeoutTimer);
            if (exports.internals.debug) {
              console.log("@supabase/gotrue-js: navigatorLock: acquired", name, lock.name);
            }
            try {
              return await fn();
            } finally {
              if (exports.internals.debug) {
                console.log("@supabase/gotrue-js: navigatorLock: released", name, lock.name);
              }
            }
          } else {
            if (acquireTimeout === 0) {
              if (exports.internals.debug) {
                console.log("@supabase/gotrue-js: navigatorLock: not immediately available", name);
              }
              throw new NavigatorLockAcquireTimeoutError(`Acquiring an exclusive Navigator LockManager lock "${name}" immediately failed`);
            } else {
              if (exports.internals.debug) {
                try {
                  const result = await globalThis.navigator.locks.query();
                  console.log("@supabase/gotrue-js: Navigator LockManager state", JSON.stringify(result, null, "  "));
                } catch (e) {
                  console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state", e);
                }
              }
              console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request");
              clearTimeout(acquireTimeoutTimer);
              return await fn();
            }
          }
        });
      } catch (e) {
        clearTimeout(acquireTimeoutTimer);
        if (e !== null && typeof e === "object" && "name" in e && e.name === "AbortError") {
          if (abortController.signal.aborted) {
            if (exports.internals.debug) {
              console.log("@supabase/gotrue-js: navigatorLock: acquire timeout, recovering by stealing lock", name);
            }
            console.warn(`@supabase/gotrue-js: Lock "${name}" was not released within ${acquireTimeout}ms. This may indicate an orphaned lock from a component unmount (e.g., React Strict Mode). Forcefully acquiring the lock to recover.`);
            return await Promise.resolve().then(() => globalThis.navigator.locks.request(name, {
              mode: "exclusive",
              steal: true
            }, async (lock) => {
              if (lock) {
                if (exports.internals.debug) {
                  console.log("@supabase/gotrue-js: navigatorLock: recovered (stolen)", name, lock.name);
                }
                try {
                  return await fn();
                } finally {
                  if (exports.internals.debug) {
                    console.log("@supabase/gotrue-js: navigatorLock: released (stolen)", name, lock.name);
                  }
                }
              } else {
                console.warn("@supabase/gotrue-js: Navigator LockManager returned null lock even with steal: true");
                return await fn();
              }
            }));
          } else {
            if (exports.internals.debug) {
              console.log("@supabase/gotrue-js: navigatorLock: lock was stolen by another request", name);
            }
            throw new NavigatorLockAcquireTimeoutError(`Lock "${name}" was released because another request stole it`);
          }
        }
        throw e;
      }
    }
    var PROCESS_LOCKS = {};
    async function processLock(name, acquireTimeout, fn) {
      var _a;
      const previousOperation = (_a = PROCESS_LOCKS[name]) !== null && _a !== void 0 ? _a : Promise.resolve();
      const previousOperationHandled = (async () => {
        try {
          await previousOperation;
          return null;
        } catch (e) {
          return null;
        }
      })();
      const currentOperation = (async () => {
        let timeoutId = null;
        try {
          const timeoutPromise = acquireTimeout >= 0 ? new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              console.warn(`@supabase/gotrue-js: Lock "${name}" acquisition timed out after ${acquireTimeout}ms. This may be caused by another operation holding the lock. Consider increasing lockAcquireTimeout or checking for stuck operations.`);
              reject(new ProcessLockAcquireTimeoutError(`Acquiring process lock with name "${name}" timed out`));
            }, acquireTimeout);
          }) : null;
          await Promise.race([previousOperationHandled, timeoutPromise].filter((x) => x));
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
          }
        } catch (e) {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
          }
          if (e instanceof LockAcquireTimeoutError) {
            throw e;
          }
        }
        return await fn();
      })();
      PROCESS_LOCKS[name] = (async () => {
        try {
          return await currentOperation;
        } catch (e) {
          if (e instanceof LockAcquireTimeoutError) {
            try {
              await previousOperation;
            } catch (prevError) {
            }
            return null;
          }
          throw e;
        }
      })();
      return await currentOperation;
    }
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/polyfills.js
var require_polyfills = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/polyfills.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.polyfillGlobalThis = polyfillGlobalThis;
    function polyfillGlobalThis() {
      if (typeof globalThis === "object")
        return;
      try {
        Object.defineProperty(Object.prototype, "__magic__", {
          get: function() {
            return this;
          },
          configurable: true
        });
        __magic__.globalThis = __magic__;
        delete Object.prototype.__magic__;
      } catch (e) {
        if (typeof self !== "undefined") {
          self.globalThis = self;
        }
      }
    }
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/web3/ethereum.js
var require_ethereum = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/web3/ethereum.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAddress = getAddress;
    exports.fromHex = fromHex;
    exports.toHex = toHex;
    exports.createSiweMessage = createSiweMessage;
    function getAddress(address) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error(`@supabase/auth-js: Address "${address}" is invalid.`);
      }
      return address.toLowerCase();
    }
    function fromHex(hex) {
      return parseInt(hex, 16);
    }
    function toHex(value) {
      const bytes = new TextEncoder().encode(value);
      const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
      return "0x" + hex;
    }
    function createSiweMessage(parameters) {
      var _a;
      const { chainId, domain, expirationTime, issuedAt = /* @__PURE__ */ new Date(), nonce, notBefore, requestId, resources, scheme, uri, version } = parameters;
      {
        if (!Number.isInteger(chainId))
          throw new Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${chainId}`);
        if (!domain)
          throw new Error(`@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.`);
        if (nonce && nonce.length < 8)
          throw new Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${nonce}`);
        if (!uri)
          throw new Error(`@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.`);
        if (version !== "1")
          throw new Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${version}`);
        if ((_a = parameters.statement) === null || _a === void 0 ? void 0 : _a.includes("\n"))
          throw new Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${parameters.statement}`);
      }
      const address = getAddress(parameters.address);
      const origin = scheme ? `${scheme}://${domain}` : domain;
      const statement = parameters.statement ? `${parameters.statement}
` : "";
      const prefix = `${origin} wants you to sign in with your Ethereum account:
${address}

${statement}`;
      let suffix = `URI: ${uri}
Version: ${version}
Chain ID: ${chainId}${nonce ? `
Nonce: ${nonce}` : ""}
Issued At: ${issuedAt.toISOString()}`;
      if (expirationTime)
        suffix += `
Expiration Time: ${expirationTime.toISOString()}`;
      if (notBefore)
        suffix += `
Not Before: ${notBefore.toISOString()}`;
      if (requestId)
        suffix += `
Request ID: ${requestId}`;
      if (resources) {
        let content = "\nResources:";
        for (const resource of resources) {
          if (!resource || typeof resource !== "string")
            throw new Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${resource}`);
          content += `
- ${resource}`;
        }
        suffix += content;
      }
      return `${prefix}
${suffix}`;
    }
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/webauthn.errors.js
var require_webauthn_errors = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/webauthn.errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebAuthnUnknownError = exports.WebAuthnError = void 0;
    exports.isWebAuthnError = isWebAuthnError;
    exports.identifyRegistrationError = identifyRegistrationError;
    exports.identifyAuthenticationError = identifyAuthenticationError;
    var webauthn_1 = require_webauthn();
    var WebAuthnError = class extends Error {
      constructor({ message, code, cause, name }) {
        var _a;
        super(message, { cause });
        this.__isWebAuthnError = true;
        this.name = (_a = name !== null && name !== void 0 ? name : cause instanceof Error ? cause.name : void 0) !== null && _a !== void 0 ? _a : "Unknown Error";
        this.code = code;
      }
      toJSON() {
        return {
          name: this.name,
          message: this.message,
          code: this.code
        };
      }
    };
    exports.WebAuthnError = WebAuthnError;
    var WebAuthnUnknownError = class extends WebAuthnError {
      constructor(message, originalError) {
        super({
          code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
          cause: originalError,
          message
        });
        this.name = "WebAuthnUnknownError";
        this.originalError = originalError;
      }
    };
    exports.WebAuthnUnknownError = WebAuthnUnknownError;
    function isWebAuthnError(error) {
      return typeof error === "object" && error !== null && "__isWebAuthnError" in error;
    }
    function identifyRegistrationError({ error, options }) {
      var _a, _b, _c;
      const { publicKey } = options;
      if (!publicKey) {
        throw Error("options was missing required publicKey property");
      }
      if (error.name === "AbortError") {
        if (options.signal instanceof AbortSignal) {
          return new WebAuthnError({
            message: "Registration ceremony was sent an abort signal",
            code: "ERROR_CEREMONY_ABORTED",
            cause: error
          });
        }
      } else if (error.name === "ConstraintError") {
        if (((_a = publicKey.authenticatorSelection) === null || _a === void 0 ? void 0 : _a.requireResidentKey) === true) {
          return new WebAuthnError({
            message: "Discoverable credentials were required but no available authenticator supported it",
            code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",
            cause: error
          });
        } else if (
          // @ts-ignore: `mediation` doesn't yet exist on CredentialCreationOptions but it's possible as of Sept 2024
          options.mediation === "conditional" && ((_b = publicKey.authenticatorSelection) === null || _b === void 0 ? void 0 : _b.userVerification) === "required"
        ) {
          return new WebAuthnError({
            message: "User verification was required during automatic registration but it could not be performed",
            code: "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",
            cause: error
          });
        } else if (((_c = publicKey.authenticatorSelection) === null || _c === void 0 ? void 0 : _c.userVerification) === "required") {
          return new WebAuthnError({
            message: "User verification was required but no available authenticator supported it",
            code: "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",
            cause: error
          });
        }
      } else if (error.name === "InvalidStateError") {
        return new WebAuthnError({
          message: "The authenticator was previously registered",
          code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",
          cause: error
        });
      } else if (error.name === "NotAllowedError") {
        return new WebAuthnError({
          message: error.message,
          code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
          cause: error
        });
      } else if (error.name === "NotSupportedError") {
        const validPubKeyCredParams = publicKey.pubKeyCredParams.filter((param) => param.type === "public-key");
        if (validPubKeyCredParams.length === 0) {
          return new WebAuthnError({
            message: 'No entry in pubKeyCredParams was of type "public-key"',
            code: "ERROR_MALFORMED_PUBKEYCREDPARAMS",
            cause: error
          });
        }
        return new WebAuthnError({
          message: "No available authenticator supported any of the specified pubKeyCredParams algorithms",
          code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",
          cause: error
        });
      } else if (error.name === "SecurityError") {
        const effectiveDomain = window.location.hostname;
        if (!(0, webauthn_1.isValidDomain)(effectiveDomain)) {
          return new WebAuthnError({
            message: `${window.location.hostname} is an invalid domain`,
            code: "ERROR_INVALID_DOMAIN",
            cause: error
          });
        } else if (publicKey.rp.id !== effectiveDomain) {
          return new WebAuthnError({
            message: `The RP ID "${publicKey.rp.id}" is invalid for this domain`,
            code: "ERROR_INVALID_RP_ID",
            cause: error
          });
        }
      } else if (error.name === "TypeError") {
        if (publicKey.user.id.byteLength < 1 || publicKey.user.id.byteLength > 64) {
          return new WebAuthnError({
            message: "User ID was not between 1 and 64 characters",
            code: "ERROR_INVALID_USER_ID_LENGTH",
            cause: error
          });
        }
      } else if (error.name === "UnknownError") {
        return new WebAuthnError({
          message: "The authenticator was unable to process the specified options, or could not create a new credential",
          code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
          cause: error
        });
      }
      return new WebAuthnError({
        message: "a Non-Webauthn related error has occurred",
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: error
      });
    }
    function identifyAuthenticationError({ error, options }) {
      const { publicKey } = options;
      if (!publicKey) {
        throw Error("options was missing required publicKey property");
      }
      if (error.name === "AbortError") {
        if (options.signal instanceof AbortSignal) {
          return new WebAuthnError({
            message: "Authentication ceremony was sent an abort signal",
            code: "ERROR_CEREMONY_ABORTED",
            cause: error
          });
        }
      } else if (error.name === "NotAllowedError") {
        return new WebAuthnError({
          message: error.message,
          code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
          cause: error
        });
      } else if (error.name === "SecurityError") {
        const effectiveDomain = window.location.hostname;
        if (!(0, webauthn_1.isValidDomain)(effectiveDomain)) {
          return new WebAuthnError({
            message: `${window.location.hostname} is an invalid domain`,
            code: "ERROR_INVALID_DOMAIN",
            cause: error
          });
        } else if (publicKey.rpId !== effectiveDomain) {
          return new WebAuthnError({
            message: `The RP ID "${publicKey.rpId}" is invalid for this domain`,
            code: "ERROR_INVALID_RP_ID",
            cause: error
          });
        }
      } else if (error.name === "UnknownError") {
        return new WebAuthnError({
          message: "The authenticator was unable to process the specified options, or could not create a new assertion signature",
          code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
          cause: error
        });
      }
      return new WebAuthnError({
        message: "a Non-Webauthn related error has occurred",
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: error
      });
    }
  }
});

// node_modules/@supabase/auth-js/dist/main/lib/webauthn.js
var require_webauthn = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/lib/webauthn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebAuthnApi = exports.DEFAULT_REQUEST_OPTIONS = exports.DEFAULT_CREATION_OPTIONS = exports.webAuthnAbortService = exports.WebAuthnAbortService = exports.identifyAuthenticationError = exports.identifyRegistrationError = exports.isWebAuthnError = exports.WebAuthnError = void 0;
    exports.deserializeCredentialCreationOptions = deserializeCredentialCreationOptions;
    exports.deserializeCredentialRequestOptions = deserializeCredentialRequestOptions;
    exports.serializeCredentialCreationResponse = serializeCredentialCreationResponse;
    exports.serializeCredentialRequestResponse = serializeCredentialRequestResponse;
    exports.isValidDomain = isValidDomain;
    exports.browserSupportsWebAuthn = browserSupportsWebAuthn;
    exports.createCredential = createCredential;
    exports.getCredential = getCredential;
    exports.mergeCredentialCreationOptions = mergeCredentialCreationOptions;
    exports.mergeCredentialRequestOptions = mergeCredentialRequestOptions;
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var base64url_1 = require_base64url();
    var errors_1 = require_errors();
    var helpers_1 = require_helpers();
    var webauthn_errors_1 = require_webauthn_errors();
    Object.defineProperty(exports, "identifyAuthenticationError", { enumerable: true, get: function() {
      return webauthn_errors_1.identifyAuthenticationError;
    } });
    Object.defineProperty(exports, "identifyRegistrationError", { enumerable: true, get: function() {
      return webauthn_errors_1.identifyRegistrationError;
    } });
    Object.defineProperty(exports, "isWebAuthnError", { enumerable: true, get: function() {
      return webauthn_errors_1.isWebAuthnError;
    } });
    Object.defineProperty(exports, "WebAuthnError", { enumerable: true, get: function() {
      return webauthn_errors_1.WebAuthnError;
    } });
    var WebAuthnAbortService = class {
      /**
       * Create an abort signal for a new WebAuthn operation.
       * Automatically cancels any existing operation.
       *
       * @returns {AbortSignal} Signal to pass to navigator.credentials.create() or .get()
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal MDN - AbortSignal}
       */
      createNewAbortSignal() {
        if (this.controller) {
          const abortError = new Error("Cancelling existing WebAuthn API call for new one");
          abortError.name = "AbortError";
          this.controller.abort(abortError);
        }
        const newController = new AbortController();
        this.controller = newController;
        return newController.signal;
      }
      /**
       * Manually cancel the current WebAuthn operation.
       * Useful for cleaning up when user cancels or navigates away.
       *
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort MDN - AbortController.abort}
       */
      cancelCeremony() {
        if (this.controller) {
          const abortError = new Error("Manually cancelling existing WebAuthn API call");
          abortError.name = "AbortError";
          this.controller.abort(abortError);
          this.controller = void 0;
        }
      }
    };
    exports.WebAuthnAbortService = WebAuthnAbortService;
    exports.webAuthnAbortService = new WebAuthnAbortService();
    function deserializeCredentialCreationOptions(options) {
      if (!options) {
        throw new Error("Credential creation options are required");
      }
      if (typeof PublicKeyCredential !== "undefined" && "parseCreationOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseCreationOptionsFromJSON === "function") {
        return PublicKeyCredential.parseCreationOptionsFromJSON(
          /** we assert the options here as typescript still doesn't know about future webauthn types */
          options
        );
      }
      const { challenge: challengeStr, user: userOpts, excludeCredentials } = options, restOptions = tslib_1.__rest(
        options,
        ["challenge", "user", "excludeCredentials"]
      );
      const challenge = (0, base64url_1.base64UrlToUint8Array)(challengeStr).buffer;
      const user = Object.assign(Object.assign({}, userOpts), { id: (0, base64url_1.base64UrlToUint8Array)(userOpts.id).buffer });
      const result = Object.assign(Object.assign({}, restOptions), {
        challenge,
        user
      });
      if (excludeCredentials && excludeCredentials.length > 0) {
        result.excludeCredentials = new Array(excludeCredentials.length);
        for (let i = 0; i < excludeCredentials.length; i++) {
          const cred = excludeCredentials[i];
          result.excludeCredentials[i] = Object.assign(Object.assign({}, cred), {
            id: (0, base64url_1.base64UrlToUint8Array)(cred.id).buffer,
            type: cred.type || "public-key",
            // Cast transports to handle future transport types like "cable"
            transports: cred.transports
          });
        }
      }
      return result;
    }
    function deserializeCredentialRequestOptions(options) {
      if (!options) {
        throw new Error("Credential request options are required");
      }
      if (typeof PublicKeyCredential !== "undefined" && "parseRequestOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseRequestOptionsFromJSON === "function") {
        return PublicKeyCredential.parseRequestOptionsFromJSON(options);
      }
      const { challenge: challengeStr, allowCredentials } = options, restOptions = tslib_1.__rest(
        options,
        ["challenge", "allowCredentials"]
      );
      const challenge = (0, base64url_1.base64UrlToUint8Array)(challengeStr).buffer;
      const result = Object.assign(Object.assign({}, restOptions), { challenge });
      if (allowCredentials && allowCredentials.length > 0) {
        result.allowCredentials = new Array(allowCredentials.length);
        for (let i = 0; i < allowCredentials.length; i++) {
          const cred = allowCredentials[i];
          result.allowCredentials[i] = Object.assign(Object.assign({}, cred), {
            id: (0, base64url_1.base64UrlToUint8Array)(cred.id).buffer,
            type: cred.type || "public-key",
            // Cast transports to handle future transport types like "cable"
            transports: cred.transports
          });
        }
      }
      return result;
    }
    function serializeCredentialCreationResponse(credential) {
      var _a;
      if ("toJSON" in credential && typeof credential.toJSON === "function") {
        return credential.toJSON();
      }
      const credentialWithAttachment = credential;
      return {
        id: credential.id,
        rawId: credential.id,
        response: {
          attestationObject: (0, base64url_1.bytesToBase64URL)(new Uint8Array(credential.response.attestationObject)),
          clientDataJSON: (0, base64url_1.bytesToBase64URL)(new Uint8Array(credential.response.clientDataJSON))
        },
        type: "public-key",
        clientExtensionResults: credential.getClientExtensionResults(),
        // Convert null to undefined and cast to AuthenticatorAttachment type
        authenticatorAttachment: (_a = credentialWithAttachment.authenticatorAttachment) !== null && _a !== void 0 ? _a : void 0
      };
    }
    function serializeCredentialRequestResponse(credential) {
      var _a;
      if ("toJSON" in credential && typeof credential.toJSON === "function") {
        return credential.toJSON();
      }
      const credentialWithAttachment = credential;
      const clientExtensionResults = credential.getClientExtensionResults();
      const assertionResponse = credential.response;
      return {
        id: credential.id,
        rawId: credential.id,
        // W3C spec expects rawId to match id for JSON format
        response: {
          authenticatorData: (0, base64url_1.bytesToBase64URL)(new Uint8Array(assertionResponse.authenticatorData)),
          clientDataJSON: (0, base64url_1.bytesToBase64URL)(new Uint8Array(assertionResponse.clientDataJSON)),
          signature: (0, base64url_1.bytesToBase64URL)(new Uint8Array(assertionResponse.signature)),
          userHandle: assertionResponse.userHandle ? (0, base64url_1.bytesToBase64URL)(new Uint8Array(assertionResponse.userHandle)) : void 0
        },
        type: "public-key",
        clientExtensionResults,
        // Convert null to undefined and cast to AuthenticatorAttachment type
        authenticatorAttachment: (_a = credentialWithAttachment.authenticatorAttachment) !== null && _a !== void 0 ? _a : void 0
      };
    }
    function isValidDomain(hostname) {
      return (
        // Consider localhost valid as well since it's okay wrt Secure Contexts
        hostname === "localhost" || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(hostname)
      );
    }
    function browserSupportsWebAuthn() {
      var _a, _b;
      return !!((0, helpers_1.isBrowser)() && "PublicKeyCredential" in window && window.PublicKeyCredential && "credentials" in navigator && typeof ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.credentials) === null || _a === void 0 ? void 0 : _a.create) === "function" && typeof ((_b = navigator === null || navigator === void 0 ? void 0 : navigator.credentials) === null || _b === void 0 ? void 0 : _b.get) === "function");
    }
    async function createCredential(options) {
      try {
        const response = await navigator.credentials.create(
          /** we assert the type here until typescript types are updated */
          options
        );
        if (!response) {
          return {
            data: null,
            error: new webauthn_errors_1.WebAuthnUnknownError("Empty credential response", response)
          };
        }
        if (!(response instanceof PublicKeyCredential)) {
          return {
            data: null,
            error: new webauthn_errors_1.WebAuthnUnknownError("Browser returned unexpected credential type", response)
          };
        }
        return { data: response, error: null };
      } catch (err) {
        return {
          data: null,
          error: (0, webauthn_errors_1.identifyRegistrationError)({
            error: err,
            options
          })
        };
      }
    }
    async function getCredential(options) {
      try {
        const response = await navigator.credentials.get(
          /** we assert the type here until typescript types are updated */
          options
        );
        if (!response) {
          return {
            data: null,
            error: new webauthn_errors_1.WebAuthnUnknownError("Empty credential response", response)
          };
        }
        if (!(response instanceof PublicKeyCredential)) {
          return {
            data: null,
            error: new webauthn_errors_1.WebAuthnUnknownError("Browser returned unexpected credential type", response)
          };
        }
        return { data: response, error: null };
      } catch (err) {
        return {
          data: null,
          error: (0, webauthn_errors_1.identifyAuthenticationError)({
            error: err,
            options
          })
        };
      }
    }
    exports.DEFAULT_CREATION_OPTIONS = {
      hints: ["security-key"],
      authenticatorSelection: {
        authenticatorAttachment: "cross-platform",
        requireResidentKey: false,
        /** set to preferred because older yubikeys don't have PIN/Biometric */
        userVerification: "preferred",
        residentKey: "discouraged"
      },
      attestation: "direct"
    };
    exports.DEFAULT_REQUEST_OPTIONS = {
      /** set to preferred because older yubikeys don't have PIN/Biometric */
      userVerification: "preferred",
      hints: ["security-key"],
      attestation: "direct"
    };
    function deepMerge(...sources) {
      const isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
      const isArrayBufferLike = (val) => val instanceof ArrayBuffer || ArrayBuffer.isView(val);
      const result = {};
      for (const source of sources) {
        if (!source)
          continue;
        for (const key in source) {
          const value = source[key];
          if (value === void 0)
            continue;
          if (Array.isArray(value)) {
            result[key] = value;
          } else if (isArrayBufferLike(value)) {
            result[key] = value;
          } else if (isObject(value)) {
            const existing = result[key];
            if (isObject(existing)) {
              result[key] = deepMerge(existing, value);
            } else {
              result[key] = deepMerge(value);
            }
          } else {
            result[key] = value;
          }
        }
      }
      return result;
    }
    function mergeCredentialCreationOptions(baseOptions, overrides) {
      return deepMerge(exports.DEFAULT_CREATION_OPTIONS, baseOptions, overrides || {});
    }
    function mergeCredentialRequestOptions(baseOptions, overrides) {
      return deepMerge(exports.DEFAULT_REQUEST_OPTIONS, baseOptions, overrides || {});
    }
    var WebAuthnApi = class {
      constructor(client) {
        this.client = client;
        this.enroll = this._enroll.bind(this);
        this.challenge = this._challenge.bind(this);
        this.verify = this._verify.bind(this);
        this.authenticate = this._authenticate.bind(this);
        this.register = this._register.bind(this);
      }
      /**
       * Enroll a new WebAuthn factor.
       * Creates an unverified WebAuthn factor that must be verified with a credential.
       *
       * @experimental This method is experimental and may change in future releases
       * @param {Omit<MFAEnrollWebauthnParams, 'factorType'>} params - Enrollment parameters (friendlyName required)
       * @returns {Promise<AuthMFAEnrollWebauthnResponse>} Enrolled factor details or error
       * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registering a New Credential}
       */
      async _enroll(params) {
        return this.client.mfa.enroll(Object.assign(Object.assign({}, params), { factorType: "webauthn" }));
      }
      /**
       * Challenge for WebAuthn credential creation or authentication.
       * Combines server challenge with browser credential operations.
       * Handles both registration (create) and authentication (request) flows.
       *
       * @experimental This method is experimental and may change in future releases
       * @param {MFAChallengeWebauthnParams & { friendlyName?: string; signal?: AbortSignal }} params - Challenge parameters including factorId
       * @param {Object} overrides - Allows you to override the parameters passed to navigator.credentials
       * @param {PublicKeyCredentialCreationOptionsFuture} overrides.create - Override options for credential creation
       * @param {PublicKeyCredentialRequestOptionsFuture} overrides.request - Override options for credential request
       * @returns {Promise<RequestResult>} Challenge response with credential or error
       * @see {@link https://w3c.github.io/webauthn/#sctn-credential-creation W3C WebAuthn Spec - Credential Creation}
       * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying Assertion}
       */
      async _challenge({ factorId, webauthn, friendlyName, signal }, overrides) {
        var _a;
        try {
          const { data: challengeResponse, error: challengeError } = await this.client.mfa.challenge({
            factorId,
            webauthn
          });
          if (!challengeResponse) {
            return { data: null, error: challengeError };
          }
          const abortSignal = signal !== null && signal !== void 0 ? signal : exports.webAuthnAbortService.createNewAbortSignal();
          if (challengeResponse.webauthn.type === "create") {
            const { user } = challengeResponse.webauthn.credential_options.publicKey;
            if (!user.name) {
              const nameToUse = friendlyName;
              if (!nameToUse) {
                const currentUser = await this.client.getUser();
                const userData = currentUser.data.user;
                const fallbackName = ((_a = userData === null || userData === void 0 ? void 0 : userData.user_metadata) === null || _a === void 0 ? void 0 : _a.name) || (userData === null || userData === void 0 ? void 0 : userData.email) || (userData === null || userData === void 0 ? void 0 : userData.id) || "User";
                user.name = `${user.id}:${fallbackName}`;
              } else {
                user.name = `${user.id}:${nameToUse}`;
              }
            }
            if (!user.displayName) {
              user.displayName = user.name;
            }
          }
          switch (challengeResponse.webauthn.type) {
            case "create": {
              const options = mergeCredentialCreationOptions(challengeResponse.webauthn.credential_options.publicKey, overrides === null || overrides === void 0 ? void 0 : overrides.create);
              const { data, error } = await createCredential({
                publicKey: options,
                signal: abortSignal
              });
              if (data) {
                return {
                  data: {
                    factorId,
                    challengeId: challengeResponse.id,
                    webauthn: {
                      type: challengeResponse.webauthn.type,
                      credential_response: data
                    }
                  },
                  error: null
                };
              }
              return { data: null, error };
            }
            case "request": {
              const options = mergeCredentialRequestOptions(challengeResponse.webauthn.credential_options.publicKey, overrides === null || overrides === void 0 ? void 0 : overrides.request);
              const { data, error } = await getCredential(Object.assign(Object.assign({}, challengeResponse.webauthn.credential_options), { publicKey: options, signal: abortSignal }));
              if (data) {
                return {
                  data: {
                    factorId,
                    challengeId: challengeResponse.id,
                    webauthn: {
                      type: challengeResponse.webauthn.type,
                      credential_response: data
                    }
                  },
                  error: null
                };
              }
              return { data: null, error };
            }
          }
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          return {
            data: null,
            error: new errors_1.AuthUnknownError("Unexpected error in challenge", error)
          };
        }
      }
      /**
       * Verify a WebAuthn credential with the server.
       * Completes the WebAuthn ceremony by sending the credential to the server for verification.
       *
       * @experimental This method is experimental and may change in future releases
       * @param {Object} params - Verification parameters
       * @param {string} params.challengeId - ID of the challenge being verified
       * @param {string} params.factorId - ID of the WebAuthn factor
       * @param {MFAVerifyWebauthnParams<T>['webauthn']} params.webauthn - WebAuthn credential response
       * @returns {Promise<AuthMFAVerifyResponse>} Verification result with session or error
       * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying an Authentication Assertion}
       * */
      async _verify({ challengeId, factorId, webauthn }) {
        return this.client.mfa.verify({
          factorId,
          challengeId,
          webauthn
        });
      }
      /**
       * Complete WebAuthn authentication flow.
       * Performs challenge and verification in a single operation for existing credentials.
       *
       * @experimental This method is experimental and may change in future releases
       * @param {Object} params - Authentication parameters
       * @param {string} params.factorId - ID of the WebAuthn factor to authenticate with
       * @param {Object} params.webauthn - WebAuthn configuration
       * @param {string} params.webauthn.rpId - Relying Party ID (defaults to current hostname)
       * @param {string[]} params.webauthn.rpOrigins - Allowed origins (defaults to current origin)
       * @param {AbortSignal} params.webauthn.signal - Optional abort signal
       * @param {PublicKeyCredentialRequestOptionsFuture} overrides - Override options for navigator.credentials.get
       * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Authentication result
       * @see {@link https://w3c.github.io/webauthn/#sctn-authentication W3C WebAuthn Spec - Authentication Ceremony}
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions MDN - PublicKeyCredentialRequestOptions}
       */
      async _authenticate({ factorId, webauthn: { rpId = typeof window !== "undefined" ? window.location.hostname : void 0, rpOrigins = typeof window !== "undefined" ? [window.location.origin] : void 0, signal } = {} }, overrides) {
        if (!rpId) {
          return {
            data: null,
            error: new errors_1.AuthError("rpId is required for WebAuthn authentication")
          };
        }
        try {
          if (!browserSupportsWebAuthn()) {
            return {
              data: null,
              error: new errors_1.AuthUnknownError("Browser does not support WebAuthn", null)
            };
          }
          const { data: challengeResponse, error: challengeError } = await this.challenge({
            factorId,
            webauthn: { rpId, rpOrigins },
            signal
          }, { request: overrides });
          if (!challengeResponse) {
            return { data: null, error: challengeError };
          }
          const { webauthn } = challengeResponse;
          return this._verify({
            factorId,
            challengeId: challengeResponse.challengeId,
            webauthn: {
              type: webauthn.type,
              rpId,
              rpOrigins,
              credential_response: webauthn.credential_response
            }
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          return {
            data: null,
            error: new errors_1.AuthUnknownError("Unexpected error in authenticate", error)
          };
        }
      }
      /**
       * Complete WebAuthn registration flow.
       * Performs enrollment, challenge, and verification in a single operation for new credentials.
       *
       * @experimental This method is experimental and may change in future releases
       * @param {Object} params - Registration parameters
       * @param {string} params.friendlyName - User-friendly name for the credential
       * @param {string} params.rpId - Relying Party ID (defaults to current hostname)
       * @param {string[]} params.rpOrigins - Allowed origins (defaults to current origin)
       * @param {AbortSignal} params.signal - Optional abort signal
       * @param {PublicKeyCredentialCreationOptionsFuture} overrides - Override options for navigator.credentials.create
       * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Registration result
       * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registration Ceremony}
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions MDN - PublicKeyCredentialCreationOptions}
       */
      async _register({ friendlyName, webauthn: { rpId = typeof window !== "undefined" ? window.location.hostname : void 0, rpOrigins = typeof window !== "undefined" ? [window.location.origin] : void 0, signal } = {} }, overrides) {
        if (!rpId) {
          return {
            data: null,
            error: new errors_1.AuthError("rpId is required for WebAuthn registration")
          };
        }
        try {
          if (!browserSupportsWebAuthn()) {
            return {
              data: null,
              error: new errors_1.AuthUnknownError("Browser does not support WebAuthn", null)
            };
          }
          const { data: factor, error: enrollError } = await this._enroll({
            friendlyName
          });
          if (!factor) {
            await this.client.mfa.listFactors().then((factors) => {
              var _a;
              return (_a = factors.data) === null || _a === void 0 ? void 0 : _a.all.find((v) => v.factor_type === "webauthn" && v.friendly_name === friendlyName && v.status === "unverified");
            }).then((factor2) => factor2 ? this.client.mfa.unenroll({ factorId: factor2 === null || factor2 === void 0 ? void 0 : factor2.id }) : void 0);
            return { data: null, error: enrollError };
          }
          const { data: challengeResponse, error: challengeError } = await this._challenge({
            factorId: factor.id,
            friendlyName: factor.friendly_name,
            webauthn: { rpId, rpOrigins },
            signal
          }, {
            create: overrides
          });
          if (!challengeResponse) {
            return { data: null, error: challengeError };
          }
          return this._verify({
            factorId: factor.id,
            challengeId: challengeResponse.challengeId,
            webauthn: {
              rpId,
              rpOrigins,
              type: challengeResponse.webauthn.type,
              credential_response: challengeResponse.webauthn.credential_response
            }
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return { data: null, error };
          }
          return {
            data: null,
            error: new errors_1.AuthUnknownError("Unexpected error in register", error)
          };
        }
      }
    };
    exports.WebAuthnApi = WebAuthnApi;
  }
});

// node_modules/@supabase/auth-js/dist/main/GoTrueClient.js
var require_GoTrueClient = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/GoTrueClient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var GoTrueAdminApi_1 = tslib_1.__importDefault(require_GoTrueAdminApi());
    var constants_1 = require_constants();
    var errors_1 = require_errors();
    var fetch_1 = require_fetch();
    var helpers_1 = require_helpers();
    var local_storage_1 = require_local_storage();
    var locks_1 = require_locks();
    var polyfills_1 = require_polyfills();
    var version_1 = require_version();
    var base64url_1 = require_base64url();
    var ethereum_1 = require_ethereum();
    var webauthn_1 = require_webauthn();
    (0, polyfills_1.polyfillGlobalThis)();
    var DEFAULT_OPTIONS = {
      url: constants_1.GOTRUE_URL,
      storageKey: constants_1.STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      headers: constants_1.DEFAULT_HEADERS,
      flowType: "implicit",
      debug: false,
      hasCustomAuthorizationHeader: false,
      throwOnError: false,
      lockAcquireTimeout: 5e3,
      // 5 seconds. Only used when a custom `lock` is supplied. TODO(v3): remove.
      skipAutoInitialize: false,
      experimental: {}
    };
    var GLOBAL_JWKS = {};
    var deprecatedLockWarned = false;
    var GoTrueClient = class _GoTrueClient {
      /**
       * The JWKS used for verifying asymmetric JWTs
       */
      get jwks() {
        var _a, _b;
        return (_b = (_a = GLOBAL_JWKS[this.storageKey]) === null || _a === void 0 ? void 0 : _a.jwks) !== null && _b !== void 0 ? _b : { keys: [] };
      }
      set jwks(value) {
        GLOBAL_JWKS[this.storageKey] = Object.assign(Object.assign({}, GLOBAL_JWKS[this.storageKey]), { jwks: value });
      }
      get jwks_cached_at() {
        var _a, _b;
        return (_b = (_a = GLOBAL_JWKS[this.storageKey]) === null || _a === void 0 ? void 0 : _a.cachedAt) !== null && _b !== void 0 ? _b : Number.MIN_SAFE_INTEGER;
      }
      set jwks_cached_at(value) {
        GLOBAL_JWKS[this.storageKey] = Object.assign(Object.assign({}, GLOBAL_JWKS[this.storageKey]), { cachedAt: value });
      }
      /**
       * Create a new client for use in the browser.
       *
       * @example Using supabase-js (recommended)
       * ```ts
       * import { createClient } from '@supabase/supabase-js'
       *
       * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
       * const { data, error } = await supabase.auth.getUser()
       * ```
       *
       * @example Standalone import for bundle-sensitive environments
       * ```ts
       * import { GoTrueClient } from '@supabase/auth-js'
       *
       * const auth = new GoTrueClient({
       *   url: 'https://xyzcompany.supabase.co/auth/v1',
       *   headers: { apikey: 'your-publishable-key' },
       *   storageKey: 'supabase-auth',
       * })
       * ```
       */
      constructor(options) {
        var _a, _b, _c;
        this.userStorage = null;
        this.memoryStorage = null;
        this.stateChangeEmitters = /* @__PURE__ */ new Map();
        this.autoRefreshTicker = null;
        this.autoRefreshTickTimeout = null;
        this.visibilityChangedCallback = null;
        this.refreshingDeferred = null;
        this.lastRefreshFailure = null;
        this._sessionRemovalEpoch = 0;
        this.initializePromise = null;
        this._pendingInitNotifications = null;
        this.detectSessionInUrl = true;
        this.hasCustomAuthorizationHeader = false;
        this.suppressGetSessionWarning = false;
        this.lock = null;
        this.lockAcquired = false;
        this.pendingInLock = [];
        this.broadcastChannel = null;
        this.logger = console.log;
        const settings = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options);
        this.storageKey = settings.storageKey;
        this.instanceID = (_a = _GoTrueClient.nextInstanceID[this.storageKey]) !== null && _a !== void 0 ? _a : 0;
        _GoTrueClient.nextInstanceID[this.storageKey] = this.instanceID + 1;
        this.logDebugMessages = !!settings.debug;
        if (typeof settings.debug === "function") {
          this.logger = settings.debug;
        }
        if (this.instanceID > 0 && (0, helpers_1.isBrowser)()) {
          const message = `${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;
          console.warn(message);
          if (this.logDebugMessages) {
            console.trace(message);
          }
        }
        this.persistSession = settings.persistSession;
        this.autoRefreshToken = settings.autoRefreshToken;
        this.experimental = (_b = settings.experimental) !== null && _b !== void 0 ? _b : {};
        this.admin = new GoTrueAdminApi_1.default({
          url: settings.url,
          headers: settings.headers,
          fetch: settings.fetch,
          experimental: this.experimental
        });
        this.url = settings.url;
        this.headers = settings.headers;
        this.fetch = (0, helpers_1.resolveFetch)(settings.fetch);
        this.detectSessionInUrl = settings.detectSessionInUrl;
        this.flowType = settings.flowType;
        this.hasCustomAuthorizationHeader = settings.hasCustomAuthorizationHeader;
        this.throwOnError = settings.throwOnError;
        this.lockAcquireTimeout = settings.lockAcquireTimeout;
        if (settings.lock != null) {
          this.lock = settings.lock;
          if (!deprecatedLockWarned) {
            deprecatedLockWarned = true;
            console.warn(`${this._logPrefix()} The "lock" option is deprecated and will be removed in v3. The client now coordinates session refreshes without a lock, so most apps can drop the option. See https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/migrations/lockless-coordination.md`);
          }
        }
        if (!this.jwks) {
          this.jwks = { keys: [] };
          this.jwks_cached_at = Number.MIN_SAFE_INTEGER;
        }
        this.mfa = {
          verify: this._verify.bind(this),
          enroll: this._enroll.bind(this),
          unenroll: this._unenroll.bind(this),
          challenge: this._challenge.bind(this),
          listFactors: this._listFactors.bind(this),
          challengeAndVerify: this._challengeAndVerify.bind(this),
          getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this),
          webauthn: new webauthn_1.WebAuthnApi(this),
          recoveryCodes: {
            getStatus: this._getRecoveryCodesStatus.bind(this),
            generate: this._generateRecoveryCodes.bind(this),
            verify: this._verifyRecoveryCode.bind(this),
            regenerate: this._regenerateRecoveryCodes.bind(this),
            unenroll: this._unenrollRecoveryCodes.bind(this)
          }
        };
        this.oauth = {
          getAuthorizationDetails: this._getAuthorizationDetails.bind(this),
          approveAuthorization: this._approveAuthorization.bind(this),
          denyAuthorization: this._denyAuthorization.bind(this),
          listGrants: this._listOAuthGrants.bind(this),
          revokeGrant: this._revokeOAuthGrant.bind(this)
        };
        this.passkey = {
          startRegistration: this._startPasskeyRegistration.bind(this),
          verifyRegistration: this._verifyPasskeyRegistration.bind(this),
          startAuthentication: this._startPasskeyAuthentication.bind(this),
          verifyAuthentication: this._verifyPasskeyAuthentication.bind(this),
          list: this._listPasskeys.bind(this),
          update: this._updatePasskey.bind(this),
          delete: this._deletePasskey.bind(this)
        };
        if (this.persistSession) {
          if (settings.storage) {
            this.storage = settings.storage;
          } else {
            if ((0, helpers_1.supportsLocalStorage)()) {
              this.storage = globalThis.localStorage;
            } else {
              this.memoryStorage = {};
              this.storage = (0, local_storage_1.memoryLocalStorageAdapter)(this.memoryStorage);
            }
          }
          if (settings.userStorage) {
            this.userStorage = settings.userStorage;
          }
        } else {
          this.memoryStorage = {};
          this.storage = (0, local_storage_1.memoryLocalStorageAdapter)(this.memoryStorage);
        }
        if ((0, helpers_1.isBrowser)() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
          try {
            this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
          } catch (e) {
            console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", e);
          }
          (_c = this.broadcastChannel) === null || _c === void 0 ? void 0 : _c.addEventListener("message", async (event) => {
            this._debug("received broadcast notification from other tab or client", event);
            if (event.data.event === "TOKEN_REFRESHED" || event.data.event === "SIGNED_IN") {
              this.lastRefreshFailure = null;
            }
            try {
              await this._notifyAllSubscribers(event.data.event, event.data.session, false);
            } catch (error) {
              this._debug("#broadcastChannel", "error", error);
            }
          });
        }
        if (!settings.skipAutoInitialize) {
          this.initialize().catch((error) => {
            this._debug("#initialize()", "error", error);
          });
        }
      }
      /**
       * Returns whether error throwing mode is enabled for this client.
       */
      isThrowOnErrorEnabled() {
        return this.throwOnError;
      }
      /**
       * Centralizes return handling with optional error throwing. When `throwOnError` is enabled
       * and the provided result contains a non-nullish error, the error is thrown instead of
       * being returned. This ensures consistent behavior across all public API methods.
       */
      _returnResult(result) {
        if (this.throwOnError && result && result.error) {
          throw result.error;
        }
        return result;
      }
      _logPrefix() {
        return `GoTrueClient@${this.storageKey}:${this.instanceID} (${version_1.version}) ${(/* @__PURE__ */ new Date()).toISOString()}`;
      }
      _debug(...args) {
        if (this.logDebugMessages) {
          this.logger(this._logPrefix(), ...args);
        }
        return this;
      }
      /**
       * Initialize the auth client by loading the session from storage or
       * detecting it from the URL after an OAuth, magic-link, or password-recovery
       * redirect.
       *
       * **Most callers do not need to invoke this directly.** The client calls it
       * automatically during construction, and to react to sign-in events (including
       * post-redirect events) you should subscribe to `onAuthStateChange` rather
       * than awaiting `initialize()`.
       *
       * You only need to call it manually when you have opted out of the automatic
       * call by passing `skipAutoInitialize: true` — for example, in an SSR context
       * where you need to control initialization timing. In that case, awaiting
       * `initialize()` returns the resolved session result (or any error encountered
       * while detecting it from the URL).
       *
       * @category Auth
       */
      async initialize() {
        var _a;
        if (this.initializePromise) {
          return await this.initializePromise;
        }
        this._pendingInitNotifications = [];
        this.initializePromise = (async () => {
          if (this.lock != null) {
            return await this._acquireLock(this.lockAcquireTimeout, async () => {
              return await this._initialize();
            });
          }
          return await this._initialize();
        })();
        const result = await this.initializePromise;
        const queue = (_a = this._pendingInitNotifications) !== null && _a !== void 0 ? _a : [];
        this._pendingInitNotifications = null;
        for (const n of queue) {
          await this._notifyAllSubscribers(n.event, n.session, n.broadcast);
        }
        return result;
      }
      /**
       * IMPORTANT:
       * 1. Never throw in this method, as it is called from the constructor
       * 2. Never return a session from this method as it would be cached over
       *    the whole lifetime of the client
       */
      async _initialize() {
        var _a;
        try {
          let params = {};
          let callbackUrlType = "none";
          if ((0, helpers_1.isBrowser)()) {
            params = (0, helpers_1.parseParametersFromURL)(window.location.href);
            if (this._isImplicitGrantCallback(params)) {
              callbackUrlType = "implicit";
            } else if (await this._isPKCECallback(params)) {
              callbackUrlType = "pkce";
            }
          }
          if ((0, helpers_1.isBrowser)() && this.detectSessionInUrl && callbackUrlType !== "none") {
            const { data, error } = await this._getSessionFromURL(params, callbackUrlType);
            if (error) {
              this._debug("#_initialize()", "error detecting session from URL", error);
              if ((0, errors_1.isAuthImplicitGrantRedirectError)(error)) {
                const errorCode = (_a = error.details) === null || _a === void 0 ? void 0 : _a.code;
                if (errorCode === "identity_already_exists" || errorCode === "identity_not_found" || errorCode === "single_identity_not_deletable") {
                  return { error };
                }
              }
              return { error };
            }
            const { session, redirectType } = data;
            this._debug("#_initialize()", "detected session in URL", session, "redirect type", redirectType);
            await this._saveSession(session);
            setTimeout(async () => {
              if (redirectType === "recovery") {
                await this._notifyAllSubscribers("PASSWORD_RECOVERY", session);
              } else {
                await this._notifyAllSubscribers("SIGNED_IN", session);
              }
            }, 0);
            return { error: null };
          }
          await this._recoverAndRefresh();
          return { error: null };
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ error });
          }
          return this._returnResult({
            error: new errors_1.AuthUnknownError("Unexpected error during initialization", error)
          });
        } finally {
          await this._handleVisibilityChange();
          this._debug("#_initialize()", "end");
        }
      }
      /**
       * Creates a new anonymous user.
       *
       * @returns A session where the is_anonymous claim in the access token JWT set to true
       *
       * @category Auth
       *
       * @remarks
       * - Returns an anonymous user
       * - It is recommended to set up captcha for anonymous sign-ins to prevent abuse. You can pass in the captcha token in the `options` param.
       *
       * @example Create an anonymous user
       * ```js
       * const { data, error } = await supabase.auth.signInAnonymously({
       *   options: {
       *     captchaToken
       *   }
       * });
       * ```
       *
       * @exampleResponse Create an anonymous user
       * ```json
       * {
       *   "data": {
       *     "user": {
       *       "id": "11111111-1111-1111-1111-111111111111",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "email": "",
       *       "phone": "",
       *       "last_sign_in_at": "2024-01-01T00:00:00Z",
       *       "app_metadata": {},
       *       "user_metadata": {},
       *       "identities": [],
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z",
       *       "is_anonymous": true
       *     },
       *     "session": {
       *       "access_token": "<ACCESS_TOKEN>",
       *       "token_type": "bearer",
       *       "expires_in": 3600,
       *       "expires_at": 1700000000,
       *       "refresh_token": "<REFRESH_TOKEN>",
       *       "user": {
       *         "id": "11111111-1111-1111-1111-111111111111",
       *         "aud": "authenticated",
       *         "role": "authenticated",
       *         "email": "",
       *         "phone": "",
       *         "last_sign_in_at": "2024-01-01T00:00:00Z",
       *         "app_metadata": {},
       *         "user_metadata": {},
       *         "identities": [],
       *         "created_at": "2024-01-01T00:00:00Z",
       *         "updated_at": "2024-01-01T00:00:00Z",
       *         "is_anonymous": true
       *       }
       *     }
       *   },
       *   "error": null
       * }
       * ```
       *
       * @example Create an anonymous user with custom user metadata
       * ```js
       * const { data, error } = await supabase.auth.signInAnonymously({
       *   options: {
       *     data
       *   }
       * })
       * ```
       */
      async signInAnonymously(credentials) {
        var _a, _b, _c;
        try {
          const res = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/signup`, {
            headers: this.headers,
            body: {
              data: (_b = (_a = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {},
              gotrue_meta_security: { captcha_token: (_c = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _c === void 0 ? void 0 : _c.captchaToken }
            },
            xform: fetch_1._sessionResponse
          });
          const { data, error } = res;
          if (error || !data) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          const session = data.session;
          const user = data.user;
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", session);
          }
          return this._returnResult({ data: { user, session }, error: null });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      }
      /**
       * Creates a new user.
       *
       * Be aware that if a user account exists in the system you may get back an
       * error message that attempts to hide this information from the user.
       * This method has support for PKCE via email signups. The PKCE flow cannot be used when autoconfirm is enabled.
       *
       * @returns A logged-in session if the server has "autoconfirm" ON
       * @returns A user if the server has "autoconfirm" OFF
       *
       * @category Auth
       *
       * @remarks
       * - By default, the user needs to verify their email address before logging in. To turn this off, disable **Confirm email** in [your project](/dashboard/project/_/auth/providers).
       * - **Confirm email** determines if users need to confirm their email address after signing up.
       *   - If **Confirm email** is enabled, a `user` is returned but `session` is null.
       *   - If **Confirm email** is disabled, both a `user` and a `session` are returned.
       * - When the user confirms their email address, they are redirected to the [`SITE_URL`](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) by default. You can modify your `SITE_URL` or add additional redirect URLs in [your project](/dashboard/project/_/auth/url-configuration).
       * - If signUp() is called for an existing confirmed user:
       *   - When both **Confirm email** and **Confirm phone** (even when phone provider is disabled) are enabled in [your project](/dashboard/project/_/auth/providers), an obfuscated/fake user object is returned.
       *   - When either **Confirm email** or **Confirm phone** (even when phone provider is disabled) is disabled, the error message, `User already registered` is returned.
       * - To fetch the currently logged-in user, refer to [`getUser()`](/docs/reference/javascript/auth-getuser).
       *
       * @example Sign up with an email and password
       * ```js
       * const { data, error } = await supabase.auth.signUp({
       *   email: 'example@email.com',
       *   password: 'example-password',
       * })
       * ```
       *
       * @exampleResponse Sign up with an email and password
       * ```json
       * // Some fields may be null if "confirm email" is enabled.
       * {
       *   "data": {
       *     "user": {
       *       "id": "11111111-1111-1111-1111-111111111111",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "email": "example@email.com",
       *       "email_confirmed_at": "2024-01-01T00:00:00Z",
       *       "phone": "",
       *       "last_sign_in_at": "2024-01-01T00:00:00Z",
       *       "app_metadata": {
       *         "provider": "email",
       *         "providers": [
       *           "email"
       *         ]
       *       },
       *       "user_metadata": {},
       *       "identities": [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "11111111-1111-1111-1111-111111111111",
       *           "user_id": "11111111-1111-1111-1111-111111111111",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": false,
       *             "phone_verified": false,
       *             "sub": "11111111-1111-1111-1111-111111111111"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "example@email.com"
       *         }
       *       ],
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z"
       *     },
       *     "session": {
       *       "access_token": "<ACCESS_TOKEN>",
       *       "token_type": "bearer",
       *       "expires_in": 3600,
       *       "expires_at": 1700000000,
       *       "refresh_token": "<REFRESH_TOKEN>",
       *       "user": {
       *         "id": "11111111-1111-1111-1111-111111111111",
       *         "aud": "authenticated",
       *         "role": "authenticated",
       *         "email": "example@email.com",
       *         "email_confirmed_at": "2024-01-01T00:00:00Z",
       *         "phone": "",
       *         "last_sign_in_at": "2024-01-01T00:00:00Z",
       *         "app_metadata": {
       *           "provider": "email",
       *           "providers": [
       *             "email"
       *           ]
       *         },
       *         "user_metadata": {},
       *         "identities": [
       *           {
       *             "identity_id": "22222222-2222-2222-2222-222222222222",
       *             "id": "11111111-1111-1111-1111-111111111111",
       *             "user_id": "11111111-1111-1111-1111-111111111111",
       *             "identity_data": {
       *               "email": "example@email.com",
       *               "email_verified": false,
       *               "phone_verified": false,
       *               "sub": "11111111-1111-1111-1111-111111111111"
       *             },
       *             "provider": "email",
       *             "last_sign_in_at": "2024-01-01T00:00:00Z",
       *             "created_at": "2024-01-01T00:00:00Z",
       *             "updated_at": "2024-01-01T00:00:00Z",
       *             "email": "example@email.com"
       *           }
       *         ],
       *         "created_at": "2024-01-01T00:00:00Z",
       *         "updated_at": "2024-01-01T00:00:00Z"
       *       }
       *     }
       *   },
       *   "error": null
       * }
       * ```
       *
       * @example Sign up with a phone number and password (SMS)
       * ```js
       * const { data, error } = await supabase.auth.signUp({
       *   phone: '123456789',
       *   password: 'example-password',
       *   options: {
       *     channel: 'sms'
       *   }
       * })
       * ```
       *
       * @exampleDescription Sign up with a phone number and password (whatsapp)
       * The user will be sent a WhatsApp message which contains a OTP. By default, a given user can only request a OTP once every 60 seconds. Note that a user will need to have a valid WhatsApp account that is linked to Twilio in order to use this feature.
       *
       * @example Sign up with a phone number and password (whatsapp)
       * ```js
       * const { data, error } = await supabase.auth.signUp({
       *   phone: '123456789',
       *   password: 'example-password',
       *   options: {
       *     channel: 'whatsapp'
       *   }
       * })
       * ```
       *
       * @example Sign up with additional user metadata
       * ```js
       * const { data, error } = await supabase.auth.signUp(
       *   {
       *     email: 'example@email.com',
       *     password: 'example-password',
       *     options: {
       *       data: {
       *         first_name: 'John',
       *         age: 27,
       *       }
       *     }
       *   }
       * )
       * ```
       *
       * @exampleDescription Sign up with a redirect URL
       * - See [redirect URLs and wildcards](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.
       *
       * @example Sign up with a redirect URL
       * ```js
       * const { data, error } = await supabase.auth.signUp(
       *   {
       *     email: 'example@email.com',
       *     password: 'example-password',
       *     options: {
       *       emailRedirectTo: 'https://example.com/welcome'
       *     }
       *   }
       * )
       * ```
       */
      async signUp(credentials) {
        var _a, _b, _c;
        let flowId = null;
        try {
          let res;
          if ("email" in credentials) {
            const { email, password, options } = credentials;
            let codeChallenge = null;
            let codeChallengeMethod = null;
            if (this.flowType === "pkce") {
              ;
              [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod();
            }
            res = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/signup`, {
              headers: this.headers,
              redirectTo: this._maybeAppendFlowIdToRedirect(options === null || options === void 0 ? void 0 : options.emailRedirectTo, flowId),
              body: {
                email,
                password,
                data: (_a = options === null || options === void 0 ? void 0 : options.data) !== null && _a !== void 0 ? _a : {},
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
                code_challenge: codeChallenge,
                code_challenge_method: codeChallengeMethod
              },
              xform: fetch_1._sessionResponse
            });
          } else if ("phone" in credentials) {
            const { phone, password, options } = credentials;
            res = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/signup`, {
              headers: this.headers,
              body: {
                phone,
                password,
                data: (_b = options === null || options === void 0 ? void 0 : options.data) !== null && _b !== void 0 ? _b : {},
                channel: (_c = options === null || options === void 0 ? void 0 : options.channel) !== null && _c !== void 0 ? _c : "sms",
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
              },
              xform: fetch_1._sessionResponse
            });
          } else {
            throw new errors_1.AuthInvalidCredentialsError("You must provide either an email or phone number and a password");
          }
          const { data, error } = res;
          if (error || !data) {
            await (0, helpers_1.removePKCEVerifier)(this.storage, this.storageKey, flowId);
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          const session = data.session;
          const user = data.user;
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", session);
          }
          return this._returnResult({ data: { user, session }, error: null });
        } catch (error) {
          await (0, helpers_1.removePKCEVerifier)(this.storage, this.storageKey, flowId);
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      }
      /**
       * Log in an existing user with an email and password or phone and password.
       *
       * Be aware that you may get back an error message that will not distinguish
       * between the cases where the account does not exist or that the
       * email/phone and password combination is wrong or that the account can only
       * be accessed via social sign-in.
       *
       * @category Auth
       *
       * @remarks
       * - Requires either an email and password or a phone number and password.
       *
       * @example Sign in with email and password
       * ```js
       * const { data, error } = await supabase.auth.signInWithPassword({
       *   email: 'example@email.com',
       *   password: 'example-password',
       * })
       * ```
       *
       * @exampleResponse Sign in with email and password
       * ```json
       * {
       *   "data": {
       *     "user": {
       *       "id": "11111111-1111-1111-1111-111111111111",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "email": "example@email.com",
       *       "email_confirmed_at": "2024-01-01T00:00:00Z",
       *       "phone": "",
       *       "last_sign_in_at": "2024-01-01T00:00:00Z",
       *       "app_metadata": {
       *         "provider": "email",
       *         "providers": [
       *           "email"
       *         ]
       *       },
       *       "user_metadata": {},
       *       "identities": [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "11111111-1111-1111-1111-111111111111",
       *           "user_id": "11111111-1111-1111-1111-111111111111",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": false,
       *             "phone_verified": false,
       *             "sub": "11111111-1111-1111-1111-111111111111"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "example@email.com"
       *         }
       *       ],
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z"
       *     },
       *     "session": {
       *       "access_token": "<ACCESS_TOKEN>",
       *       "token_type": "bearer",
       *       "expires_in": 3600,
       *       "expires_at": 1700000000,
       *       "refresh_token": "<REFRESH_TOKEN>",
       *       "user": {
       *         "id": "11111111-1111-1111-1111-111111111111",
       *         "aud": "authenticated",
       *         "role": "authenticated",
       *         "email": "example@email.com",
       *         "email_confirmed_at": "2024-01-01T00:00:00Z",
       *         "phone": "",
       *         "last_sign_in_at": "2024-01-01T00:00:00Z",
       *         "app_metadata": {
       *           "provider": "email",
       *           "providers": [
       *             "email"
       *           ]
       *         },
       *         "user_metadata": {},
       *         "identities": [
       *           {
       *             "identity_id": "22222222-2222-2222-2222-222222222222",
       *             "id": "11111111-1111-1111-1111-111111111111",
       *             "user_id": "11111111-1111-1111-1111-111111111111",
       *             "identity_data": {
       *               "email": "example@email.com",
       *               "email_verified": false,
       *               "phone_verified": false,
       *               "sub": "11111111-1111-1111-1111-111111111111"
       *             },
       *             "provider": "email",
       *             "last_sign_in_at": "2024-01-01T00:00:00Z",
       *             "created_at": "2024-01-01T00:00:00Z",
       *             "updated_at": "2024-01-01T00:00:00Z",
       *             "email": "example@email.com"
       *           }
       *         ],
       *         "created_at": "2024-01-01T00:00:00Z",
       *         "updated_at": "2024-01-01T00:00:00Z"
       *       }
       *     }
       *   },
       *   "error": null
       * }
       * ```
       *
       * @example Sign in with phone and password
       * ```js
       * const { data, error } = await supabase.auth.signInWithPassword({
       *   phone: '+13334445555',
       *   password: 'some-password',
       * })
       * ```
       *
       * @exampleDescription Handling errors
       * Log the full `error` object so fields like `code`, `status`, and `name` aren't hidden. The `error.code` (e.g. `'invalid_credentials'`, `'email_not_confirmed'`) is often more useful for branching than `error.message`, and the full object surfaces both.
       *
       * @example Handling errors
       * ```js
       * const { data, error } = await supabase.auth.signInWithPassword({
       *   email: 'example@email.com',
       *   password: 'example-password',
       * })
       * if (error) {
       *   console.error(error)
       *   return
       * }
       * ```
       */
      async signInWithPassword(credentials) {
        try {
          let res;
          if ("email" in credentials) {
            const { email, password, options } = credentials;
            res = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
              headers: this.headers,
              body: {
                email,
                password,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
              },
              xform: fetch_1._sessionResponsePassword
            });
          } else if ("phone" in credentials) {
            const { phone, password, options } = credentials;
            res = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
              headers: this.headers,
              body: {
                phone,
                password,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
              },
              xform: fetch_1._sessionResponsePassword
            });
          } else {
            throw new errors_1.AuthInvalidCredentialsError("You must provide either an email or phone number and a password");
          }
          const { data, error } = res;
          if (error) {
            return this._returnResult({ data: { user: null, session: null }, error });
          } else if (!data || !data.session || !data.user) {
            const invalidTokenError = new errors_1.AuthInvalidTokenResponseError();
            return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", data.session);
          }
          return this._returnResult({
            data: Object.assign({ user: data.user, session: data.session }, data.weak_password ? { weakPassword: data.weak_password } : null),
            error
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      }
      /**
       * Log in an existing user via a third-party provider.
       * This method supports the PKCE flow.
       *
       * @category Auth
       *
       * @remarks
       * - This method is used for signing in using [social sign-in (OAuth) providers](/docs/guides/auth/social-sign-in).
       * - It works by redirecting your application to the provider's authorization screen, before bringing back the user to your app.
       *
       * @example Sign in using a third-party provider
       * ```js
       * const { data, error } = await supabase.auth.signInWithOAuth({
       *   provider: 'github'
       * })
       * ```
       *
       * @exampleResponse Sign in using a third-party provider
       * ```json
       * {
       *   data: {
       *     provider: 'github',
       *     url: <PROVIDER_URL_TO_REDIRECT_TO>,
       *     flowId: <PKCE_FLOW_ID_OR_NULL>
       *   },
       *   error: null
       * }
       * ```
       *
       * @exampleDescription Sign in using a third-party provider with redirect
       * - When the OAuth provider successfully authenticates the user, they are redirected to the URL specified in the `redirectTo` parameter. This parameter defaults to the [`SITE_URL`](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls). It does not redirect the user immediately after invoking this method.
       * - See [redirect URLs and wildcards](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.
       *
       * @example Sign in using a third-party provider with redirect
       * ```js
       * const { data, error } = await supabase.auth.signInWithOAuth({
       *   provider: 'github',
       *   options: {
       *     redirectTo: 'https://example.com/welcome'
       *   }
       * })
       * ```
       *
       * @exampleDescription Sign in with scopes and access provider tokens
       * If you need additional access from an OAuth provider, in order to access provider specific APIs in the name of the user, you can do this by passing in the scopes the user should authorize for your application. Note that the `scopes` option takes in **a space-separated list** of scopes.
       *
       * Because OAuth sign-in often includes redirects, you should register an `onAuthStateChange` callback immediately after you create the Supabase client. This callback will listen for the presence of `provider_token` and `provider_refresh_token` properties on the `session` object and store them in local storage. The client library will emit these values **only once** immediately after the user signs in. You can then access them by looking them up in local storage, or send them to your backend servers for further processing.
       *
       * Finally, make sure you remove them from local storage on the `SIGNED_OUT` event. If the OAuth provider supports token revocation, make sure you call those APIs either from the frontend or schedule them to be called on the backend.
       *
       * @example Sign in with scopes and access provider tokens
       * ```js
       * // Register this immediately after calling createClient!
       * // Because signInWithOAuth causes a redirect, you need to fetch the
       * // provider tokens from the callback.
       * supabase.auth.onAuthStateChange((event, session) => {
       *   if (session && session.provider_token) {
       *     window.localStorage.setItem('oauth_provider_token', session.provider_token)
       *   }
       *
       *   if (session && session.provider_refresh_token) {
       *     window.localStorage.setItem('oauth_provider_refresh_token', session.provider_refresh_token)
       *   }
       *
       *   if (event === 'SIGNED_OUT') {
       *     window.localStorage.removeItem('oauth_provider_token')
       *     window.localStorage.removeItem('oauth_provider_refresh_token')
       *   }
       * })
       *
       * // Call this on your Sign in with GitHub button to initiate OAuth
       * // with GitHub with the requested elevated scopes.
       * await supabase.auth.signInWithOAuth({
       *   provider: 'github',
       *   options: {
       *     scopes: 'repo gist notifications'
       *   }
       * })
       * ```
       */
      async signInWithOAuth(credentials) {
        var _a, _b, _c, _d;
        return await this._handleProviderSignIn(credentials.provider, {
          redirectTo: (_a = credentials.options) === null || _a === void 0 ? void 0 : _a.redirectTo,
          scopes: (_b = credentials.options) === null || _b === void 0 ? void 0 : _b.scopes,
          queryParams: (_c = credentials.options) === null || _c === void 0 ? void 0 : _c.queryParams,
          skipBrowserRedirect: (_d = credentials.options) === null || _d === void 0 ? void 0 : _d.skipBrowserRedirect
        });
      }
      /**
       * Log in an existing user by exchanging an Auth Code issued during the PKCE flow.
       *
       * @category Auth
       *
       * @remarks
       * - Used when `flowType` is set to `pkce` in client options.
       * - When several PKCE flows are in flight at once, pass `options.flowId` so
       *   the code is exchanged with the verifier created by that specific flow.
       *   The flow id is returned by `signInWithOAuth`, and with
       *   `experimental.appendPkceFlowIdToRedirects` enabled it also arrives on
       *   your callback URL as the reserved `sb_flow_id` query parameter (read
       *   automatically in a browser).
       * - When a flow id is present but its stored verifier is gone (evicted,
       *   already used, or from another device), the call fails with a verifier
       *   missing error instead of trying another flow's verifier — a mismatched
       *   verifier would consume the single-use code. Without any flow id the
       *   most recently stored verifier is used, as before.
       *
       * @example Exchange Auth Code
       * ```js
       * supabase.auth.exchangeCodeForSession('34e770dd-9ff9-416c-87fa-43b31d7ef225')
       * ```
       *
       * @example Exchange Auth Code for a specific flow (e.g. in a server-side callback handler)
       * ```js
       * const flowId = requestUrl.searchParams.get('sb_flow_id')
       * supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined)
       * ```
       *
       * @exampleResponse Exchange Auth Code
       * ```json
       * {
       *   "data": {
       *     session: {
       *       access_token: '<ACCESS_TOKEN>',
       *       token_type: 'bearer',
       *       expires_in: 3600,
       *       expires_at: 1700000000,
       *       refresh_token: '<REFRESH_TOKEN>',
       *       user: {
       *         id: '11111111-1111-1111-1111-111111111111',
       *         aud: 'authenticated',
       *         role: 'authenticated',
       *         email: 'example@email.com'
       *         email_confirmed_at: '2024-01-01T00:00:00Z',
       *         phone: '',
       *         confirmation_sent_at: '2024-01-01T00:00:00Z',
       *         confirmed_at: '2024-01-01T00:00:00Z',
       *         last_sign_in_at: '2024-01-01T00:00:00Z',
       *         app_metadata: {
       *           "provider": "email",
       *           "providers": [
       *             "email",
       *             "<OTHER_PROVIDER>"
       *           ]
       *         },
       *         user_metadata: {
       *           email: 'email@email.com',
       *           email_verified: true,
       *           full_name: 'User Name',
       *           iss: '<ISS>',
       *           name: 'User Name',
       *           phone_verified: false,
       *           provider_id: '<PROVIDER_ID>',
       *           sub: '<SUB>'
       *         },
       *         identities: [
       *           {
       *             "identity_id": "22222222-2222-2222-2222-222222222222",
       *             "id": "11111111-1111-1111-1111-111111111111",
       *             "user_id": "11111111-1111-1111-1111-111111111111",
       *             "identity_data": {
       *               "email": "example@email.com",
       *               "email_verified": false,
       *               "phone_verified": false,
       *               "sub": "11111111-1111-1111-1111-111111111111"
       *             },
       *             "provider": "email",
       *             "last_sign_in_at": "2024-01-01T00:00:00Z",
       *             "created_at": "2024-01-01T00:00:00Z",
       *             "updated_at": "2024-01-01T00:00:00Z",
       *             "email": "email@example.com"
       *           },
       *           {
       *             "identity_id": "33333333-3333-3333-3333-333333333333",
       *             "id": "<ID>",
       *             "user_id": "<USER_ID>",
       *             "identity_data": {
       *               "email": "example@email.com",
       *               "email_verified": true,
       *               "full_name": "User Name",
       *               "iss": "<ISS>",
       *               "name": "User Name",
       *               "phone_verified": false,
       *               "provider_id": "<PROVIDER_ID>",
       *               "sub": "<SUB>"
       *             },
       *             "provider": "<PROVIDER>",
       *             "last_sign_in_at": "2024-01-01T00:00:00Z",
       *             "created_at": "2024-01-01T00:00:00Z",
       *             "updated_at": "2024-01-01T00:00:00Z",
       *             "email": "example@email.com"
       *           }
       *         ],
       *         created_at: '2024-01-01T00:00:00Z',
       *         updated_at: '2024-01-01T00:00:00Z',
       *         is_anonymous: false
       *       },
       *       provider_token: '<PROVIDER_TOKEN>',
       *       provider_refresh_token: '<PROVIDER_REFRESH_TOKEN>'
       *     },
       *     user: {
       *       id: '11111111-1111-1111-1111-111111111111',
       *       aud: 'authenticated',
       *       role: 'authenticated',
       *       email: 'example@email.com',
       *       email_confirmed_at: '2024-01-01T00:00:00Z',
       *       phone: '',
       *       confirmation_sent_at: '2024-01-01T00:00:00Z',
       *       confirmed_at: '2024-01-01T00:00:00Z',
       *       last_sign_in_at: '2024-01-01T00:00:00Z',
       *       app_metadata: {
       *         provider: 'email',
       *         providers: [
       *           "email",
       *           "<OTHER_PROVIDER>"
       *         ]
       *       },
       *       user_metadata: {
       *         email: 'email@email.com',
       *         email_verified: true,
       *         full_name: 'User Name',
       *         iss: '<ISS>',
       *         name: 'User Name',
       *         phone_verified: false,
       *         provider_id: '<PROVIDER_ID>',
       *         sub: '<SUB>'
       *       },
       *       identities: [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "11111111-1111-1111-1111-111111111111",
       *           "user_id": "11111111-1111-1111-1111-111111111111",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": false,
       *             "phone_verified": false,
       *             "sub": "11111111-1111-1111-1111-111111111111"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "email@example.com"
       *         },
       *         {
       *           "identity_id": "33333333-3333-3333-3333-333333333333",
       *           "id": "<ID>",
       *           "user_id": "<USER_ID>",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": true,
       *             "full_name": "User Name",
       *             "iss": "<ISS>",
       *             "name": "User Name",
       *             "phone_verified": false,
       *             "provider_id": "<PROVIDER_ID>",
       *             "sub": "<SUB>"
       *           },
       *           "provider": "<PROVIDER>",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "example@email.com"
       *         }
       *       ],
       *       created_at: '2024-01-01T00:00:00Z',
       *       updated_at: '2024-01-01T00:00:00Z',
       *       is_anonymous: false
       *     },
       *     redirectType: null
       *   },
       *   "error": null
       * }
       * ```
       */
      async exchangeCodeForSession(authCode, options) {
        await this.initializePromise;
        if (this.lock != null) {
          return this._acquireLock(this.lockAcquireTimeout, async () => {
            return this._exchangeCodeForSession(authCode, options);
          });
        }
        return this._exchangeCodeForSession(authCode, options);
      }
      /**
       * Signs in a user by verifying a message signed by the user's private key.
       * Supports Ethereum (via Sign-In-With-Ethereum) & Solana (Sign-In-With-Solana) standards,
       * both of which derive from the EIP-4361 standard
       * With slight variation on Solana's side.
       * @reference https://eips.ethereum.org/EIPS/eip-4361
       *
       * @category Auth
       *
       * @remarks
       * - Uses a Web3 (Ethereum, Solana) wallet to sign a user in.
       * - Read up on the [potential for abuse](/docs/guides/auth/auth-web3#potential-for-abuse) before using it.
       *
       * @example Sign in with Solana or Ethereum (Window API)
       * ```js
       *   // uses window.ethereum for the wallet
       *   const { data, error } = await supabase.auth.signInWithWeb3({
       *     chain: 'ethereum',
       *     statement: 'I accept the Terms of Service at https://example.com/tos'
       *   })
       *
       *   // uses window.solana for the wallet
       *   const { data, error } = await supabase.auth.signInWithWeb3({
       *     chain: 'solana',
       *     statement: 'I accept the Terms of Service at https://example.com/tos'
       *   })
       * ```
       *
       * @example Sign in with Ethereum (Message and Signature)
       * ```js
       *   const { data, error } = await supabase.auth.signInWithWeb3({
       *     chain: 'ethereum',
       *     message: '<sign in with ethereum message>',
       *     signature: '<hex of the ethereum signature over the message>',
       *   })
       * ```
       *
       * @example Sign in with Solana (Brave)
       * ```js
       *   const { data, error } = await supabase.auth.signInWithWeb3({
       *     chain: 'solana',
       *     statement: 'I accept the Terms of Service at https://example.com/tos',
       *     wallet: window.braveSolana
       *   })
       * ```
       *
       * @example Sign in with Solana (Wallet Adapter)
       * ```jsx
       *   function SignInButton() {
       *   const wallet = useWallet()
       *
       *   return (
       *     <>
       *       {wallet.connected ? (
       *         <button
       *           onClick={() => {
       *             supabase.auth.signInWithWeb3({
       *               chain: 'solana',
       *               statement: 'I accept the Terms of Service at https://example.com/tos',
       *               wallet,
       *             })
       *           }}
       *         >
       *           Sign in with Solana
       *         </button>
       *       ) : (
       *         <WalletMultiButton />
       *       )}
       *     </>
       *   )
       * }
       *
       * function App() {
       *   const endpoint = clusterApiUrl('devnet')
       *   const wallets = useMemo(() => [], [])
       *
       *   return (
       *     <ConnectionProvider endpoint={endpoint}>
       *       <WalletProvider wallets={wallets}>
       *         <WalletModalProvider>
       *           <SignInButton />
       *         </WalletModalProvider>
       *       </WalletProvider>
       *     </ConnectionProvider>
       *   )
       * }
       * ```
       */
      async signInWithWeb3(credentials) {
        const { chain } = credentials;
        switch (chain) {
          case "ethereum":
            return await this.signInWithEthereum(credentials);
          case "solana":
            return await this.signInWithSolana(credentials);
          default:
            throw new Error(`@supabase/auth-js: Unsupported chain "${chain}"`);
        }
      }
      async signInWithEthereum(credentials) {
        var _a, _b, _c, _d, _f, _g, _h, _j, _k, _l, _m;
        let message;
        let signature;
        if ("message" in credentials) {
          message = credentials.message;
          signature = credentials.signature;
        } else {
          const { chain, wallet, statement, options } = credentials;
          let resolvedWallet;
          if (!(0, helpers_1.isBrowser)()) {
            if (typeof wallet !== "object" || !(options === null || options === void 0 ? void 0 : options.url)) {
              throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
            }
            resolvedWallet = wallet;
          } else if (typeof wallet === "object") {
            resolvedWallet = wallet;
          } else {
            const windowAny = window;
            if ("ethereum" in windowAny && typeof windowAny.ethereum === "object" && "request" in windowAny.ethereum && typeof windowAny.ethereum.request === "function") {
              resolvedWallet = windowAny.ethereum;
            } else {
              throw new Error(`@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.`);
            }
          }
          const url = new URL((_a = options === null || options === void 0 ? void 0 : options.url) !== null && _a !== void 0 ? _a : window.location.href);
          const accounts = await resolvedWallet.request({
            method: "eth_requestAccounts"
          }).then((accs) => accs).catch(() => {
            throw new Error(`@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid`);
          });
          if (!accounts || accounts.length === 0) {
            throw new Error(`@supabase/auth-js: No accounts available. Please ensure the wallet is connected.`);
          }
          const address = (0, ethereum_1.getAddress)(accounts[0]);
          let chainId = (_b = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _b === void 0 ? void 0 : _b.chainId;
          if (!chainId) {
            const chainIdHex = await resolvedWallet.request({
              method: "eth_chainId"
            });
            chainId = (0, ethereum_1.fromHex)(chainIdHex);
          }
          const siweMessage = {
            domain: url.host,
            address,
            statement,
            uri: url.href,
            version: "1",
            chainId,
            nonce: (_c = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _c === void 0 ? void 0 : _c.nonce,
            issuedAt: (_f = (_d = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _d === void 0 ? void 0 : _d.issuedAt) !== null && _f !== void 0 ? _f : /* @__PURE__ */ new Date(),
            expirationTime: (_g = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _g === void 0 ? void 0 : _g.expirationTime,
            notBefore: (_h = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _h === void 0 ? void 0 : _h.notBefore,
            requestId: (_j = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _j === void 0 ? void 0 : _j.requestId,
            resources: (_k = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _k === void 0 ? void 0 : _k.resources
          };
          message = (0, ethereum_1.createSiweMessage)(siweMessage);
          signature = await resolvedWallet.request({
            method: "personal_sign",
            params: [(0, ethereum_1.toHex)(message), address]
          });
        }
        try {
          const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
            headers: this.headers,
            body: Object.assign({
              chain: "ethereum",
              message,
              signature
            }, ((_l = credentials.options) === null || _l === void 0 ? void 0 : _l.captchaToken) ? { gotrue_meta_security: { captcha_token: (_m = credentials.options) === null || _m === void 0 ? void 0 : _m.captchaToken } } : null),
            xform: fetch_1._sessionResponse
          });
          if (error) {
            throw error;
          }
          if (!data || !data.session || !data.user) {
            const invalidTokenError = new errors_1.AuthInvalidTokenResponseError();
            return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", data.session);
          }
          return this._returnResult({ data: Object.assign({}, data), error });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      }
      async signInWithSolana(credentials) {
        var _a, _b, _c, _d, _f, _g, _h, _j, _k, _l, _m, _o;
        let message;
        let signature;
        if ("message" in credentials) {
          message = credentials.message;
          signature = credentials.signature;
        } else {
          const { chain, wallet, statement, options } = credentials;
          let resolvedWallet;
          if (!(0, helpers_1.isBrowser)()) {
            if (typeof wallet !== "object" || !(options === null || options === void 0 ? void 0 : options.url)) {
              throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
            }
            resolvedWallet = wallet;
          } else if (typeof wallet === "object") {
            resolvedWallet = wallet;
          } else {
            const windowAny = window;
            if ("solana" in windowAny && typeof windowAny.solana === "object" && ("signIn" in windowAny.solana && typeof windowAny.solana.signIn === "function" || "signMessage" in windowAny.solana && typeof windowAny.solana.signMessage === "function")) {
              resolvedWallet = windowAny.solana;
            } else {
              throw new Error(`@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.`);
            }
          }
          const url = new URL((_a = options === null || options === void 0 ? void 0 : options.url) !== null && _a !== void 0 ? _a : window.location.href);
          if ("signIn" in resolvedWallet && resolvedWallet.signIn) {
            const output = await resolvedWallet.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, options === null || options === void 0 ? void 0 : options.signInWithSolana), {
              // non-overridable properties
              version: "1",
              domain: url.host,
              uri: url.href
            }), statement ? { statement } : null));
            let outputToProcess;
            if (Array.isArray(output) && output[0] && typeof output[0] === "object") {
              outputToProcess = output[0];
            } else if (output && typeof output === "object" && "signedMessage" in output && "signature" in output) {
              outputToProcess = output;
            } else {
              throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
            }
            if ("signedMessage" in outputToProcess && "signature" in outputToProcess && (typeof outputToProcess.signedMessage === "string" || outputToProcess.signedMessage instanceof Uint8Array) && outputToProcess.signature instanceof Uint8Array) {
              message = typeof outputToProcess.signedMessage === "string" ? outputToProcess.signedMessage : new TextDecoder().decode(outputToProcess.signedMessage);
              signature = outputToProcess.signature;
            } else {
              throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
            }
          } else {
            if (!("signMessage" in resolvedWallet) || typeof resolvedWallet.signMessage !== "function" || !("publicKey" in resolvedWallet) || typeof resolvedWallet !== "object" || !resolvedWallet.publicKey || !("toBase58" in resolvedWallet.publicKey) || typeof resolvedWallet.publicKey.toBase58 !== "function") {
              throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
            }
            message = [
              `${url.host} wants you to sign in with your Solana account:`,
              resolvedWallet.publicKey.toBase58(),
              ...statement ? ["", statement, ""] : [""],
              "Version: 1",
              `URI: ${url.href}`,
              `Issued At: ${(_c = (_b = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _b === void 0 ? void 0 : _b.issuedAt) !== null && _c !== void 0 ? _c : (/* @__PURE__ */ new Date()).toISOString()}`,
              ...((_d = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _d === void 0 ? void 0 : _d.notBefore) ? [`Not Before: ${options.signInWithSolana.notBefore}`] : [],
              ...((_f = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _f === void 0 ? void 0 : _f.expirationTime) ? [`Expiration Time: ${options.signInWithSolana.expirationTime}`] : [],
              ...((_g = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _g === void 0 ? void 0 : _g.chainId) ? [`Chain ID: ${options.signInWithSolana.chainId}`] : [],
              ...((_h = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _h === void 0 ? void 0 : _h.nonce) ? [`Nonce: ${options.signInWithSolana.nonce}`] : [],
              ...((_j = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _j === void 0 ? void 0 : _j.requestId) ? [`Request ID: ${options.signInWithSolana.requestId}`] : [],
              ...((_l = (_k = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _k === void 0 ? void 0 : _k.resources) === null || _l === void 0 ? void 0 : _l.length) ? [
                "Resources",
                ...options.signInWithSolana.resources.map((resource) => `- ${resource}`)
              ] : []
            ].join("\n");
            const maybeSignature = await resolvedWallet.signMessage(new TextEncoder().encode(message), "utf8");
            if (!maybeSignature || !(maybeSignature instanceof Uint8Array)) {
              throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
            }
            signature = maybeSignature;
          }
        }
        try {
          const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
            headers: this.headers,
            body: Object.assign({ chain: "solana", message, signature: (0, base64url_1.bytesToBase64URL)(signature) }, ((_m = credentials.options) === null || _m === void 0 ? void 0 : _m.captchaToken) ? { gotrue_meta_security: { captcha_token: (_o = credentials.options) === null || _o === void 0 ? void 0 : _o.captchaToken } } : null),
            xform: fetch_1._sessionResponse
          });
          if (error) {
            throw error;
          }
          if (!data || !data.session || !data.user) {
            const invalidTokenError = new errors_1.AuthInvalidTokenResponseError();
            return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", data.session);
          }
          return this._returnResult({ data: Object.assign({}, data), error });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      }
      async _exchangeCodeForSession(authCode, options) {
        const hasExplicitFlowId = (options === null || options === void 0 ? void 0 : options.flowId) != null;
        const requestedFlowId = hasExplicitFlowId ? (0, helpers_1.validatePKCEFlowId)(options === null || options === void 0 ? void 0 : options.flowId) : (0, helpers_1.isBrowser)() ? (0, helpers_1.validatePKCEFlowId)((0, helpers_1.parseParametersFromURL)(window.location.href)[constants_1.PKCE_FLOW_ID_PARAM]) : null;
        if (hasExplicitFlowId && !requestedFlowId) {
          this._debug("#_exchangeCodeForSession()", "provided flowId is not a valid flow id", options === null || options === void 0 ? void 0 : options.flowId);
        }
        const { verifier: storageItem, flowId } = hasExplicitFlowId && !requestedFlowId ? { verifier: null, flowId: null } : await (0, helpers_1.retrievePKCEVerifier)(this.storage, this.storageKey, requestedFlowId);
        const [codeVerifier, redirectType] = (storageItem !== null && storageItem !== void 0 ? storageItem : "").split("/");
        try {
          if (!codeVerifier && this.flowType === "pkce") {
            throw new errors_1.AuthPKCECodeVerifierMissingError();
          }
          const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
            headers: this.headers,
            body: {
              auth_code: authCode,
              code_verifier: codeVerifier
            },
            xform: fetch_1._sessionResponse
          });
          await (0, helpers_1.removePKCEVerifier)(this.storage, this.storageKey, flowId);
          if (error) {
            throw error;
          }
          if (!data || !data.session || !data.user) {
            const invalidTokenError = new errors_1.AuthInvalidTokenResponseError();
            return this._returnResult({
              data: { user: null, session: null, redirectType: null },
              error: invalidTokenError
            });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers(redirectType === "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", data.session);
          }
          return this._returnResult({ data: Object.assign(Object.assign({}, data), { redirectType: redirectType !== null && redirectType !== void 0 ? redirectType : null }), error });
        } catch (error) {
          await (0, helpers_1.removePKCEVerifier)(this.storage, this.storageKey, flowId);
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({
              data: { user: null, session: null, redirectType: null },
              error
            });
          }
          throw error;
        }
      }
      /**
       * Allows signing in with an OIDC ID token. The authentication provider used
       * should be enabled and configured.
       *
       * @category Auth
       *
       * @remarks
       * - Use an ID token to sign in.
       * - Especially useful when implementing sign in using native platform dialogs in mobile or desktop apps using Sign in with Apple or Sign in with Google on iOS and Android.
       * - You can also use Google's [One Tap](https://developers.google.com/identity/gsi/web/guides/display-google-one-tap) and [Automatic sign-in](https://developers.google.com/identity/gsi/web/guides/automatic-sign-in-sign-out) via this API.
       *
       * @example Sign In using ID Token
       * ```js
       * const { data, error } = await supabase.auth.signInWithIdToken({
       *   provider: 'google',
       *   token: 'your-id-token'
       * })
       * ```
       *
       * @exampleResponse Sign In using ID Token
       * ```json
       * {
       *   "data": {
       *     "user": {
       *       "id": "11111111-1111-1111-1111-111111111111",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "last_sign_in_at": "2024-01-01T00:00:00Z",
       *       "app_metadata": {
       *         ...
       *       },
       *       "user_metadata": {
       *         ...
       *       },
       *       "identities": [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "provider": "google",
       *         }
       *       ],
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z",
       *     },
       *     "session": {
       *       "access_token": "<ACCESS_TOKEN>",
       *       "token_type": "bearer",
       *       "expires_in": 3600,
       *       "expires_at": 1700000000,
       *       "refresh_token": "<REFRESH_TOKEN>",
       *       "user": {
       *         "id": "11111111-1111-1111-1111-111111111111",
       *         "aud": "authenticated",
       *         "role": "authenticated",
       *         "last_sign_in_at": "2024-01-01T00:00:00Z",
       *         "app_metadata": {
       *           ...
       *         },
       *         "user_metadata": {
       *           ...
       *         },
       *         "identities": [
       *           {
       *             "identity_id": "22222222-2222-2222-2222-222222222222",
       *             "provider": "google",
       *           }
       *         ],
       *         "created_at": "2024-01-01T00:00:00Z",
       *         "updated_at": "2024-01-01T00:00:00Z",
       *       }
       *     }
       *   },
       *   "error": null
       * }
       * ```
       */
      async signInWithIdToken(credentials) {
        try {
          const { options, provider, token, access_token, nonce } = credentials;
          const res = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
            headers: this.headers,
            body: {
              provider,
              id_token: token,
              access_token,
              nonce,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            },
            xform: fetch_1._sessionResponse
          });
          const { data, error } = res;
          if (error) {
            return this._returnResult({ data: { user: null, session: null }, error });
          } else if (!data || !data.session || !data.user) {
            const invalidTokenError = new errors_1.AuthInvalidTokenResponseError();
            return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", data.session);
          }
          return this._returnResult({ data, error });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      }
      /**
       * Log in a user using magiclink or a one-time password (OTP).
       *
       * If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent.
       * If the `{{ .Token }}` variable is specified in the email template, an OTP will be sent.
       * If you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.
       *
       * Be aware that you may get back an error message that will not distinguish
       * between the cases where the account does not exist or, that the account
       * can only be accessed via social sign-in.
       *
       * Do note that you will need to configure a Whatsapp sender on Twilio
       * if you are using phone sign in with the 'whatsapp' channel. The whatsapp
       * channel is not supported on other providers
       * at this time.
       * This method supports PKCE when an email is passed.
       *
       * @category Auth
       *
       * @remarks
       * - Requires either an email or phone number.
       * - This method is used for passwordless sign-ins where a OTP is sent to the user's email or phone number.
       * - If the user doesn't exist, `signInWithOtp()` will signup the user instead. To restrict this behavior, you can set `shouldCreateUser` in `SignInWithPasswordlessCredentials.options` to `false`.
       * - If you're using an email, you can configure whether you want the user to receive a magiclink or a OTP.
       * - If you're using phone, you can configure whether you want the user to receive a OTP.
       * - The magic link's destination URL is determined by the [`SITE_URL`](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls).
       * - See [redirect URLs and wildcards](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.
       * - Magic links and OTPs share the same implementation. To send users a one-time code instead of a magic link, [modify the magic link email template](/dashboard/project/_/auth/templates) to include `{{ .Token }}` instead of `{{ .ConfirmationURL }}`.
       * - See our [Twilio Phone Auth Guide](/docs/guides/auth/phone-login?showSMSProvider=Twilio) for details about configuring WhatsApp sign in.
       *
       * @exampleDescription Sign in with email
       * The user will be sent an email which contains either a magiclink or a OTP or both. By default, a given user can only request a OTP once every 60 seconds.
       *
       * @example Sign in with email
       * ```js
       * const { data, error } = await supabase.auth.signInWithOtp({
       *   email: 'example@email.com',
       *   options: {
       *     emailRedirectTo: 'https://example.com/welcome'
       *   }
       * })
       * ```
       *
       * @exampleResponse Sign in with email
       * ```json
       * {
       *   "data": {
       *     "user": null,
       *     "session": null
       *   },
       *   "error": null
       * }
       * ```
       *
       * @exampleDescription Sign in with SMS OTP
       * The user will be sent a SMS which contains a OTP. By default, a given user can only request a OTP once every 60 seconds.
       *
       * @example Sign in with SMS OTP
       * ```js
       * const { data, error } = await supabase.auth.signInWithOtp({
       *   phone: '+13334445555',
       * })
       * ```
       *
       * @exampleDescription Sign in with WhatsApp OTP
       * The user will be sent a WhatsApp message which contains a OTP. By default, a given user can only request a OTP once every 60 seconds. Note that a user will need to have a valid WhatsApp account that is linked to Twilio in order to use this feature.
       *
       * @example Sign in with WhatsApp OTP
       * ```js
       * const { data, error } = await supabase.auth.signInWithOtp({
       *   phone: '+13334445555',
       *   options: {
       *     channel:'whatsapp',
       *   }
       * })
       * ```
       */
      async signInWithOtp(credentials) {
        var _a, _b, _c, _d, _f;
        let flowId = null;
        try {
          if ("email" in credentials) {
            const { email, options } = credentials;
            let codeChallenge = null;
            let codeChallengeMethod = null;
            if (this.flowType === "pkce") {
              ;
              [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod();
            }
            const { error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/otp`, {
              headers: this.headers,
              body: {
                email,
                data: (_a = options === null || options === void 0 ? void 0 : options.data) !== null && _a !== void 0 ? _a : {},
                create_user: (_b = options === null || options === void 0 ? void 0 : options.shouldCreateUser) !== null && _b !== void 0 ? _b : true,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
                code_challenge: codeChallenge,
                code_challenge_method: codeChallengeMethod
              },
              redirectTo: this._maybeAppendFlowIdToRedirect(options === null || options === void 0 ? void 0 : options.emailRedirectTo, flowId)
            });
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          if ("phone" in credentials) {
            const { phone, options } = credentials;
            const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/otp`, {
              headers: this.headers,
              body: {
                phone,
                data: (_c = options === null || options === void 0 ? void 0 : options.data) !== null && _c !== void 0 ? _c : {},
                create_user: (_d = options === null || options === void 0 ? void 0 : options.shouldCreateUser) !== null && _d !== void 0 ? _d : true,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
                channel: (_f = options === null || options === void 0 ? void 0 : options.channel) !== null && _f !== void 0 ? _f : "sms"
              }
            });
            return this._returnResult({
              data: { user: null, session: null, messageId: data === null || data === void 0 ? void 0 : data.message_id },
              error
            });
          }
          throw new errors_1.AuthInvalidCredentialsError("You must provide either an email or phone number.");
        } catch (error) {
          await (0, helpers_1.removePKCEVerifier)(this.storage, this.storageKey, flowId);
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      }
      /**
       * Log in a user given a User supplied OTP or TokenHash received through mobile or email.
       *
       * @category Auth
       *
       * @remarks
       * - The `verifyOtp` method takes in different verification types.
       * - If a phone number is used, the type can either be:
       *   1. `sms` – Used when verifying a one-time password (OTP) sent via SMS during sign-up or sign-in.
       *   2. `phone_change` – Used when verifying an OTP sent to a new phone number during a phone number update process.
       * - If an email address is used, the type can be one of the following (note: `signup` and `magiclink` types are deprecated):
       *   1. `email` – Used when verifying an OTP sent to the user's email during sign-up or sign-in.
       *   2. `recovery` – Used when verifying an OTP sent for account recovery, typically after a password reset request.
       *   3. `invite` – Used when verifying an OTP sent as part of an invitation to join a project or organization.
       *   4. `email_change` – Used when verifying an OTP sent to a new email address during an email update process.
       * - The verification type used should be determined based on the corresponding auth method called before `verifyOtp` to sign up / sign-in a user.
       * - The `TokenHash` is contained in the [email templates](/docs/guides/auth/auth-email-templates) and can be used to sign in.  You may wish to use the hash for the PKCE flow for Server Side Auth. Read [the Password-based Auth guide](/docs/guides/auth/passwords) for more details.
       *
       * @example Verify Signup One-Time Password (OTP)
       * ```js
       * const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email'})
       * ```
       *
       * @exampleResponse Verify Signup One-Time Password (OTP)
       * ```json
       * {
       *   "data": {
       *     "user": {
       *       "id": "11111111-1111-1111-1111-111111111111",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "email": "example@email.com",
       *       "email_confirmed_at": "2024-01-01T00:00:00Z",
       *       "phone": "",
       *       "confirmed_at": "2024-01-01T00:00:00Z",
       *       "recovery_sent_at": "2024-01-01T00:00:00Z",
       *       "last_sign_in_at": "2024-01-01T00:00:00Z",
       *       "app_metadata": {
       *         "provider": "email",
       *         "providers": [
       *           "email"
       *         ]
       *       },
       *       "user_metadata": {
       *         "email": "example@email.com",
       *         "email_verified": false,
       *         "phone_verified": false,
       *         "sub": "11111111-1111-1111-1111-111111111111"
       *       },
       *       "identities": [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "11111111-1111-1111-1111-111111111111",
       *           "user_id": "11111111-1111-1111-1111-111111111111",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": false,
       *             "phone_verified": false,
       *             "sub": "11111111-1111-1111-1111-111111111111"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "example@email.com"
       *         }
       *       ],
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z",
       *       "is_anonymous": false
       *     },
       *     "session": {
       *       "access_token": "<ACCESS_TOKEN>",
       *       "token_type": "bearer",
       *       "expires_in": 3600,
       *       "expires_at": 1700000000,
       *       "refresh_token": "<REFRESH_TOKEN>",
       *       "user": {
       *         "id": "11111111-1111-1111-1111-111111111111",
       *         "aud": "authenticated",
       *         "role": "authenticated",
       *         "email": "example@email.com",
       *         "email_confirmed_at": "2024-01-01T00:00:00Z",
       *         "phone": "",
       *         "confirmed_at": "2024-01-01T00:00:00Z",
       *         "recovery_sent_at": "2024-01-01T00:00:00Z",
       *         "last_sign_in_at": "2024-01-01T00:00:00Z",
       *         "app_metadata": {
       *           "provider": "email",
       *           "providers": [
       *             "email"
       *           ]
       *         },
       *         "user_metadata": {
       *           "email": "example@email.com",
       *           "email_verified": false,
       *           "phone_verified": false,
       *           "sub": "11111111-1111-1111-1111-111111111111"
       *         },
       *         "identities": [
       *           {
       *             "identity_id": "22222222-2222-2222-2222-222222222222",
       *             "id": "11111111-1111-1111-1111-111111111111",
       *             "user_id": "11111111-1111-1111-1111-111111111111",
       *             "identity_data": {
       *               "email": "example@email.com",
       *               "email_verified": false,
       *               "phone_verified": false,
       *               "sub": "11111111-1111-1111-1111-111111111111"
       *             },
       *             "provider": "email",
       *             "last_sign_in_at": "2024-01-01T00:00:00Z",
       *             "created_at": "2024-01-01T00:00:00Z",
       *             "updated_at": "2024-01-01T00:00:00Z",
       *             "email": "example@email.com"
       *           }
       *         ],
       *         "created_at": "2024-01-01T00:00:00Z",
       *         "updated_at": "2024-01-01T00:00:00Z",
       *         "is_anonymous": false
       *       }
       *     }
       *   },
       *   "error": null
       * }
       * ```
       *
       * @example Verify SMS One-Time Password (OTP)
       * ```js
       * const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms'})
       * ```
       *
       * @example Verify Email Auth (Token Hash)
       * ```js
       * const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email'})
       * ```
       */
      async verifyOtp(params) {
        var _a, _b;
        try {
          let redirectTo = void 0;
          let captchaToken = void 0;
          if ("options" in params) {
            redirectTo = (_a = params.options) === null || _a === void 0 ? void 0 : _a.redirectTo;
            captchaToken = (_b = params.options) === null || _b === void 0 ? void 0 : _b.captchaToken;
          }
          const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/verify`, {
            headers: this.headers,
            body: Object.assign(Object.assign({}, params), { gotrue_meta_security: { captcha_token: captchaToken } }),
            redirectTo,
            xform: fetch_1._sessionResponse
          });
          if (error) {
            throw error;
          }
          if (!data) {
            const tokenVerificationError = new Error("An error occurred on token verification.");
            throw tokenVerificationError;
          }
          const session = data.session;
          const user = data.user;
          if (session === null || session === void 0 ? void 0 : session.access_token) {
            await this._saveSession(session);
            await this._notifyAllSubscribers(params.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", session);
          }
          return this._returnResult({ data: { user, session }, error: null });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      }
      /**
       * Attempts a single-sign on using an enterprise Identity Provider. A
       * successful SSO attempt will redirect the current page to the identity
       * provider authorization page. The redirect URL is implementation and SSO
       * protocol specific.
       *
       * You can use it by providing a SSO domain. Typically you can extract this
       * domain by asking users for their email address. If this domain is
       * registered on the Auth instance the redirect will use that organization's
       * currently active SSO Identity Provider for the login.
       *
       * If you have built an organization-specific login page, you can use the
       * organization's SSO Identity Provider UUID directly instead.
       *
       * @category Auth
       *
       * @remarks
       * - Before you can call this method you need to [establish a connection](/docs/guides/auth/sso/auth-sso-saml#managing-saml-20-connections) to an identity provider. Use the [CLI commands](/docs/reference/cli/supabase-sso) to do this.
       * - If you've associated an email domain to the identity provider, you can use the `domain` property to start a sign-in flow.
       * - In case you need to use a different way to start the authentication flow with an identity provider, you can use the `providerId` property. For example:
       *     - Mapping specific user email addresses with an identity provider.
       *     - Using different hints to identity the identity provider to be used by the user, like a company-specific page, IP address or other tracking information.
       *
       * @example Sign in with email domain
       * ```js
       *   // You can extract the user's email domain and use it to trigger the
       *   // authentication flow with the correct identity provider.
       *
       *   const { data, error } = await supabase.auth.signInWithSSO({
       *     domain: 'company.com'
       *   })
       *
       *   if (data?.url) {
       *     // redirect the user to the identity provider's authentication flow
       *     window.location.href = data.url
       *   }
       * ```
       *
       * @example Sign in with provider UUID
       * ```js
       *   // Useful when you need to map a user's sign in request according
       *   // to different rules that can't use email domains.
       *
       *   const { data, error } = await supabase.auth.signInWithSSO({
       *     providerId: '21648a9d-8d5a-4555-a9d1-d6375dc14e92'
       *   })
       *
       *   if (data?.url) {
       *     // redirect the user to the identity provider's authentication flow
       *     window.location.href = data.url
       *   }
       * ```
       */
      async signInWithSSO(params) {
        var _a, _b, _c, _d;
        let flowId = null;
        try {
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce") {
            ;
            [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod();
          }
          const result = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/sso`, {
            body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in params ? { provider_id: params.providerId } : null), "domain" in params ? { domain: params.domain } : null), { redirect_to: this._maybeAppendFlowIdToRedirect((_a = params.options) === null || _a === void 0 ? void 0 : _a.redirectTo, flowId) }), ((_b = params === null || params === void 0 ? void 0 : params.options) === null || _b === void 0 ? void 0 : _b.captchaToken) ? { gotrue_meta_security: { captcha_token: params.options.captchaToken } } : null), { skip_http_redirect: true, code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }),
            headers: this.headers,
            xform: fetch_1._ssoResponse
          });
          if (((_c = result.data) === null || _c === void 0 ? void 0 : _c.url) && (0, helpers_1.isBrowser)() && !((_d = params.options) === null || _d === void 0 ? void 0 : _d.skipBrowserRedirect)) {
            window.location.assign(result.data.url);
          }
          return this._returnResult(result);
        } catch (error) {
          await (0, helpers_1.removePKCEVerifier)(this.storage, this.storageKey, flowId);
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Sends a reauthentication OTP to the user's email or phone number.
       * Requires the user to be signed-in.
       *
       * @category Auth
       *
       * @remarks
       * - This method is used together with `updateUser()` when a user's password needs to be updated.
       * - If you require your user to reauthenticate before updating their password, you need to enable the **Secure password change** option in your [project's email provider settings](/dashboard/project/_/auth/providers).
       * - A user is only require to reauthenticate before updating their password if **Secure password change** is enabled and the user **hasn't recently signed in**. A user is deemed recently signed in if the session was created in the last 24 hours.
       * - This method will send a nonce to the user's email. If the user doesn't have a confirmed email address, the method will send the nonce to the user's confirmed phone number instead.
       * - After receiving the OTP, include it as the `nonce` in your `updateUser()` call to finalize the password change.
       *
       * @exampleDescription Send reauthentication nonce
       * Sends a reauthentication nonce to the user's email or phone number.
       *
       * @example Send reauthentication nonce
       * ```js
       * const { error } = await supabase.auth.reauthenticate()
       * ```
       */
      async reauthenticate() {
        await this.initializePromise;
        if (this.lock != null) {
          return await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._reauthenticate();
          });
        }
        return await this._reauthenticate();
      }
      async _reauthenticate() {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError)
              throw sessionError;
            if (!session)
              throw new errors_1.AuthSessionMissingError();
            const { error } = await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/reauthenticate`, {
              headers: this.headers,
              jwt: session.access_token
            });
            return this._returnResult({ data: { user: null, session: null }, error });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      }
      /**
       * Resends an existing signup confirmation email, email change email, SMS OTP or phone change OTP.
       *
       * @category Auth
       *
       * @remarks
       * - Resends a signup confirmation, email change or phone change email to the user.
       * - Passwordless sign-ins can be resent by calling the `signInWithOtp()` method again.
       * - Password recovery emails can be resent by calling the `resetPasswordForEmail()` method again.
       * - This method will only resend an email or phone OTP to the user if there was an initial signup, email change or phone change request being made(note: For existing users signing in with OTP, you should use `signInWithOtp()` again to resend the OTP).
       * - You can specify a redirect url when you resend an email link using the `emailRedirectTo` option.
       *
       * @exampleDescription Resend an email signup confirmation
       * Resends the email signup confirmation to the user
       *
       * @example Resend an email signup confirmation
       * ```js
       * const { error } = await supabase.auth.resend({
       *   type: 'signup',
       *   email: 'email@example.com',
       *   options: {
       *     emailRedirectTo: 'https://example.com/welcome'
       *   }
       * })
       * ```
       *
       * @exampleDescription Resend a phone signup confirmation
       * Resends the phone signup confirmation email to the user
       *
       * @example Resend a phone signup confirmation
       * ```js
       * const { error } = await supabase.auth.resend({
       *   type: 'sms',
       *   phone: '1234567890'
       * })
       * ```
       *
       * @exampleDescription Resend email change email
       * Resends the email change email to the user
       *
       * @example Resend email change email
       * ```js
       * const { error } = await supabase.auth.resend({
       *   type: 'email_change',
       *   email: 'email@example.com'
       * })
       * ```
       *
       * @exampleDescription Resend phone change OTP
       * Resends the phone change OTP to the user
       *
       * @example Resend phone change OTP
       * ```js
       * const { error } = await supabase.auth.resend({
       *   type: 'phone_change',
       *   phone: '1234567890'
       * })
       * ```
       */
      async resend(credentials) {
        let flowId = null;
        try {
          const endpoint = `${this.url}/resend`;
          if ("email" in credentials) {
            const { email, type, options } = credentials;
            let codeChallenge = null;
            let codeChallengeMethod = null;
            if (this.flowType === "pkce") {
              ;
              [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod();
            }
            const { error } = await (0, fetch_1._request)(this.fetch, "POST", endpoint, {
              headers: this.headers,
              body: {
                email,
                type,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
                code_challenge: codeChallenge,
                code_challenge_method: codeChallengeMethod
              },
              redirectTo: this._maybeAppendFlowIdToRedirect(options === null || options === void 0 ? void 0 : options.emailRedirectTo, flowId)
            });
            if (error) {
              await (0, helpers_1.removePKCEVerifier)(this.storage, this.storageKey, flowId);
            }
            return this._returnResult({ data: { user: null, session: null }, error });
          } else if ("phone" in credentials) {
            const { phone, type, options } = credentials;
            const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", endpoint, {
              headers: this.headers,
              body: {
                phone,
                type,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
              }
            });
            return this._returnResult({
              data: { user: null, session: null, messageId: data === null || data === void 0 ? void 0 : data.message_id },
              error
            });
          }
          throw new errors_1.AuthInvalidCredentialsError("You must provide either an email or phone number and a type");
        } catch (error) {
          await (0, helpers_1.removePKCEVerifier)(this.storage, this.storageKey, flowId);
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      }
      /**
       * Returns the session, refreshing it if necessary.
       *
       * The session returned can be null if the session is not detected which can happen in the event a user is not signed-in or has logged out.
       *
       * **IMPORTANT:** This method loads values directly from the storage attached
       * to the client. If that storage is based on request cookies for example,
       * the values in it may not be authentic and therefore it's strongly advised
       * against using this method and its results in such circumstances. A warning
       * will be emitted if this is detected. Use {@link GoTrueClient.getUser} instead.
       *
       * @category Auth
       *
       * @remarks
       * - Since the introduction of [asymmetric JWT signing keys](/docs/guides/auth/signing-keys), this method is considered low-level and we encourage you to use `getClaims()` or `getUser()` instead.
       * - Retrieves the current [user session](/docs/guides/auth/sessions) from the storage medium (local storage, cookies).
       * - The session contains an access token (signed JWT), a refresh token and the user object.
       * - If the session's access token is expired or is about to expire, this method will use the refresh token to refresh the session.
       * - When using in a browser, or you've called `startAutoRefresh()` in your environment (React Native, etc.) this function always returns a valid access token without refreshing the session itself, as this is done in the background. This function returns very fast.
       * - **IMPORTANT SECURITY NOTICE:** If using an insecure storage medium, such as cookies or request headers, the user object returned by this function **must not be trusted**. Always verify the JWT using `getClaims()` or your own JWT verification library to securely establish the user's identity and access. You can also use `getUser()` to fetch the user object directly from the Auth server for this purpose.
       * - Cross-tab refresh races are handled by the GoTrue server (the rotated token from the first tab is returned to subsequent tabs via the parent-of-active mechanism), so no client-side serialization is needed.
       *
       * @example Get the session data
       * ```js
       * const { data, error } = await supabase.auth.getSession()
       * ```
       *
       * @exampleResponse Get the session data
       * ```json
       * {
       *   "data": {
       *     "session": {
       *       "access_token": "<ACCESS_TOKEN>",
       *       "token_type": "bearer",
       *       "expires_in": 3600,
       *       "expires_at": 1700000000,
       *       "refresh_token": "<REFRESH_TOKEN>",
       *       "user": {
       *         "id": "11111111-1111-1111-1111-111111111111",
       *         "aud": "authenticated",
       *         "role": "authenticated",
       *         "email": "example@email.com",
       *         "email_confirmed_at": "2024-01-01T00:00:00Z",
       *         "phone": "",
       *         "last_sign_in_at": "2024-01-01T00:00:00Z",
       *         "app_metadata": {
       *           "provider": "email",
       *           "providers": [
       *             "email"
       *           ]
       *         },
       *         "user_metadata": {
       *           "email": "example@email.com",
       *           "email_verified": false,
       *           "phone_verified": false,
       *           "sub": "11111111-1111-1111-1111-111111111111"
       *         },
       *         "identities": [
       *           {
       *             "identity_id": "22222222-2222-2222-2222-222222222222",
       *             "id": "11111111-1111-1111-1111-111111111111",
       *             "user_id": "11111111-1111-1111-1111-111111111111",
       *             "identity_data": {
       *               "email": "example@email.com",
       *               "email_verified": false,
       *               "phone_verified": false,
       *               "sub": "11111111-1111-1111-1111-111111111111"
       *             },
       *             "provider": "email",
       *             "last_sign_in_at": "2024-01-01T00:00:00Z",
       *             "created_at": "2024-01-01T00:00:00Z",
       *             "updated_at": "2024-01-01T00:00:00Z",
       *             "email": "example@email.com"
       *           }
       *         ],
       *         "created_at": "2024-01-01T00:00:00Z",
       *         "updated_at": "2024-01-01T00:00:00Z",
       *         "is_anonymous": false
       *       }
       *     }
       *   },
       *   "error": null
       * }
       * ```
       */
      async getSession() {
        await this.initializePromise;
        if (this.lock != null) {
          return await this._acquireLock(this.lockAcquireTimeout, async () => {
            return this._useSession(async (result) => {
              return result;
            });
          });
        }
        return await this._useSession(async (result) => {
          return result;
        });
      }
      /**
       * Acquires a global lock based on the storage key.
       *
       * TODO(v3): remove along with the legacy lock path. Only called when
       * `this.lock` is non-null (custom lock supplied via constructor). The
       * default lockless path bypasses this entirely.
       */
      async _acquireLock(acquireTimeout, fn) {
        this._debug("#_acquireLock", "begin", acquireTimeout);
        try {
          if (this.lockAcquired) {
            const last = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve();
            const result = (async () => {
              await last;
              return await fn();
            })();
            this.pendingInLock.push((async () => {
              try {
                await result;
              } catch (_e) {
              }
            })());
            return result;
          }
          return await this.lock(`lock:${this.storageKey}`, acquireTimeout, async () => {
            this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
            try {
              this.lockAcquired = true;
              const result = fn();
              this.pendingInLock.push((async () => {
                try {
                  await result;
                } catch (e) {
                }
              })());
              await result;
              while (this.pendingInLock.length) {
                const waitOn = [...this.pendingInLock];
                await Promise.all(waitOn);
                this.pendingInLock.splice(0, waitOn.length);
              }
              return await result;
            } finally {
              this._debug("#_acquireLock", "lock released for storage key", this.storageKey);
              this.lockAcquired = false;
            }
          });
        } finally {
          this._debug("#_acquireLock", "end");
        }
      }
      /**
       * Use instead of {@link GoTrueClient.getSession} inside the library. Loads the session
       * via `__loadSession` (which may trigger a refresh if the access token is
       * within the expiry margin) and runs `fn` with the result.
       */
      async _useSession(fn) {
        this._debug("#_useSession", "begin");
        try {
          const result = await this.__loadSession();
          return await fn(result);
        } finally {
          this._debug("#_useSession", "end");
        }
      }
      /**
       * NEVER USE DIRECTLY!
       *
       * Always use `_useSession`.
       */
      async __loadSession() {
        this._debug("#__loadSession()", "begin");
        if (this.lock != null && !this.lockAcquired) {
          this._debug("#__loadSession()", "used outside of an acquired lock!", new Error().stack);
        }
        try {
          let currentSession = null;
          const maybeSession = await (0, helpers_1.getItemAsync)(this.storage, this.storageKey);
          this._debug("#getSession()", "session from storage", maybeSession);
          if (maybeSession !== null) {
            if (this._isValidSession(maybeSession)) {
              currentSession = maybeSession;
            } else {
              this._debug("#getSession()", "session from storage is not valid");
              await this._removeSession();
            }
          }
          if (!currentSession) {
            return { data: { session: null }, error: null };
          }
          const hasExpired = currentSession.expires_at ? currentSession.expires_at * 1e3 - Date.now() < constants_1.EXPIRY_MARGIN_MS : false;
          this._debug("#__loadSession()", `session has${hasExpired ? "" : " not"} expired`, "expires_at", currentSession.expires_at);
          if (!hasExpired) {
            return { data: { session: await this._hydrateSessionUser(currentSession) }, error: null };
          }
          const { data: session, error } = await this._callRefreshToken(currentSession.refresh_token);
          if (error) {
            const stored = await (0, helpers_1.getItemAsync)(this.storage, this.storageKey);
            if (stored && this._isValidSession(stored) && stored.expires_at && stored.expires_at * 1e3 > Date.now()) {
              return this._returnResult({
                data: { session: await this._hydrateSessionUser(stored) },
                error: null
              });
            }
            return this._returnResult({ data: { session: null }, error });
          }
          return this._returnResult({ data: { session }, error: null });
        } finally {
          this._debug("#__loadSession()", "end");
        }
      }
      /**
       * Completes a session read back from storage so it matches what callers of
       * `getSession()` expect: fills in `session.user` from `userStorage` when the
       * client keeps the user in split storage, and wraps the user in the
       * insecure-access warning proxy on the server.
       */
      async _hydrateSessionUser(session) {
        if (this.userStorage) {
          const maybeUser = await (0, helpers_1.getItemAsync)(this.userStorage, this.storageKey + "-user");
          session.user = (maybeUser === null || maybeUser === void 0 ? void 0 : maybeUser.user) ? maybeUser.user : (0, helpers_1.userNotAvailableProxy)();
        }
        if (this.storage.isServer && session.user && !session.user.__isUserNotAvailableProxy) {
          const suppressWarningRef = { value: this.suppressGetSessionWarning };
          session.user = (0, helpers_1.insecureUserWarningProxy)(session.user, suppressWarningRef);
          if (suppressWarningRef.value) {
            this.suppressGetSessionWarning = true;
          }
        }
        return session;
      }
      /**
       * Gets the current user details if there is an existing session. This method
       * performs a network request to the Supabase Auth server, so the returned
       * value is authentic and can be used to base authorization rules on.
       *
       * @param jwt Takes in an optional access token JWT. If no JWT is provided, the JWT from the current session is used.
       *
       * @category Auth
       *
       * @remarks
       * - This method fetches the user object from the database instead of local session.
       * - This method is useful for checking if the user is authorized because it validates the user's access token JWT on the server.
       * - Should always be used when checking for user authorization on the server. On the client, you can instead use `getSession().session.user` for faster results. `getSession` is insecure on the server.
       *
       * @example Get the logged in user with the current existing session
       * ```js
       * const { data: { user } } = await supabase.auth.getUser()
       * ```
       *
       * @exampleResponse Get the logged in user with the current existing session
       * ```json
       * {
       *   "data": {
       *     "user": {
       *       "id": "11111111-1111-1111-1111-111111111111",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "email": "example@email.com",
       *       "email_confirmed_at": "2024-01-01T00:00:00Z",
       *       "phone": "",
       *       "confirmed_at": "2024-01-01T00:00:00Z",
       *       "last_sign_in_at": "2024-01-01T00:00:00Z",
       *       "app_metadata": {
       *         "provider": "email",
       *         "providers": [
       *           "email"
       *         ]
       *       },
       *       "user_metadata": {
       *         "email": "example@email.com",
       *         "email_verified": false,
       *         "phone_verified": false,
       *         "sub": "11111111-1111-1111-1111-111111111111"
       *       },
       *       "identities": [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "11111111-1111-1111-1111-111111111111",
       *           "user_id": "11111111-1111-1111-1111-111111111111",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": false,
       *             "phone_verified": false,
       *             "sub": "11111111-1111-1111-1111-111111111111"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "example@email.com"
       *         }
       *       ],
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z",
       *       "is_anonymous": false
       *     }
       *   },
       *   "error": null
       * }
       * ```
       *
       * @example Get the logged in user with a custom access token jwt
       * ```js
       * const { data: { user } } = await supabase.auth.getUser(jwt)
       * ```
       */
      async getUser(jwt) {
        if (jwt) {
          return await this._getUser(jwt);
        }
        await this.initializePromise;
        let result;
        if (this.lock != null) {
          result = await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._getUser();
          });
        } else {
          result = await this._getUser();
        }
        if (result.data.user) {
          this.suppressGetSessionWarning = true;
        }
        return result;
      }
      async _getUser(jwt) {
        try {
          if (jwt) {
            return await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/user`, {
              headers: this.headers,
              jwt,
              xform: fetch_1._userResponse
            });
          }
          return await this._useSession(async (result) => {
            var _a, _b, _c;
            const { data, error } = result;
            if (error) {
              throw error;
            }
            if (!((_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) && !this.hasCustomAuthorizationHeader) {
              return { data: { user: null }, error: new errors_1.AuthSessionMissingError() };
            }
            return await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/user`, {
              headers: this.headers,
              jwt: (_c = (_b = data.session) === null || _b === void 0 ? void 0 : _b.access_token) !== null && _c !== void 0 ? _c : void 0,
              xform: fetch_1._userResponse
            });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            if ((0, errors_1.isAuthSessionMissingError)(error)) {
              await this._removeSession();
            }
            return this._returnResult({ data: { user: null }, error });
          }
          throw error;
        }
      }
      /**
       * Updates user data for a logged in user.
       *
       * @category Auth
       *
       * @remarks
       * - In order to use the `updateUser()` method, the user needs to be signed in first.
       * - By default, email updates sends a confirmation link to both the user's current and new email.
       * To only send a confirmation link to the user's new email, disable **Secure email change** in your project's [email auth provider settings](/dashboard/project/_/auth/providers).
       *
       * @exampleDescription Update the email for an authenticated user
       * Sends a "Confirm Email Change" email to the new address. If **Secure Email Change** is enabled (default), confirmation is also required from the **old email** before the change is applied. To skip dual confirmation and apply the change after only the new email is verified, disable **Secure Email Change** in the [Email Auth Provider settings](/dashboard/project/_/auth/providers?provider=Email).
       *
       * @example Update the email for an authenticated user
       * ```js
       * const { data, error } = await supabase.auth.updateUser({
       *   email: 'new@email.com'
       * })
       * ```
       *
       * @exampleResponse Update the email for an authenticated user
       * ```json
       * {
       *   "data": {
       *     "user": {
       *       "id": "11111111-1111-1111-1111-111111111111",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "email": "example@email.com",
       *       "email_confirmed_at": "2024-01-01T00:00:00Z",
       *       "phone": "",
       *       "confirmed_at": "2024-01-01T00:00:00Z",
       *       "new_email": "new@email.com",
       *       "email_change_sent_at": "2024-01-01T00:00:00Z",
       *       "last_sign_in_at": "2024-01-01T00:00:00Z",
       *       "app_metadata": {
       *         "provider": "email",
       *         "providers": [
       *           "email"
       *         ]
       *       },
       *       "user_metadata": {
       *         "email": "example@email.com",
       *         "email_verified": false,
       *         "phone_verified": false,
       *         "sub": "11111111-1111-1111-1111-111111111111"
       *       },
       *       "identities": [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "11111111-1111-1111-1111-111111111111",
       *           "user_id": "11111111-1111-1111-1111-111111111111",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": false,
       *             "phone_verified": false,
       *             "sub": "11111111-1111-1111-1111-111111111111"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "example@email.com"
       *         }
       *       ],
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z",
       *       "is_anonymous": false
       *     }
       *   },
       *   "error": null
       * }
       * ```
       *
       * @exampleDescription Update the phone number for an authenticated user
       * Sends a one-time password (OTP) to the new phone number.
       *
       * @example Update the phone number for an authenticated user
       * ```js
       * const { data, error } = await supabase.auth.updateUser({
       *   phone: '123456789'
       * })
       * ```
       *
       * @example Update the password for an authenticated user
       * ```js
       * const { data, error } = await supabase.auth.updateUser({
       *   password: 'new password'
       * })
       * ```
       *
       * @exampleDescription Update the user's metadata
       * Updates the user's custom metadata.
       *
       * **Note**: The `data` field maps to the `auth.users.raw_user_meta_data` column in your Supabase database. When calling `getUser()`, the data will be available as `user.user_metadata`.
       *
       * @example Update the user's metadata
       * ```js
       * const { data, error } = await supabase.auth.updateUser({
       *   data: { hello: 'world' }
       * })
       * ```
       *
       * @exampleDescription Update the user's password with a nonce
       * If **Secure password change** is enabled in your [project's email provider settings](/dashboard/project/_/auth/providers), updating the user's password would require a nonce if the user **hasn't recently signed in**. The nonce is sent to the user's email or phone number. A user is deemed recently signed in if the session was created in the last 24 hours.
       *
       * @example Update the user's password with a nonce
       * ```js
       * const { data, error } = await supabase.auth.updateUser({
       *   password: 'new password',
       *   nonce: '123456'
       * })
       * ```
       */
      async updateUser(attributes, options = {}) {
        await this.initializePromise;
        if (this.lock != null) {
          return await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._updateUser(attributes, options);
          });
        }
        return await this._updateUser(attributes, options);
      }
      async _updateUser(attributes, options = {}) {
        let flowId = null;
        try {
          return await this._useSession(async (result) => {
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              throw sessionError;
            }
            if (!sessionData.session) {
              throw new errors_1.AuthSessionMissingError();
            }
            const session = sessionData.session;
            let codeChallenge = null;
            let codeChallengeMethod = null;
            if (this.flowType === "pkce" && attributes.email != null) {
              ;
              [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod();
            }
            const { data, error: userError } = await (0, fetch_1._request)(this.fetch, "PUT", `${this.url}/user`, {
              headers: this.headers,
              redirectTo: this._maybeAppendFlowIdToRedirect(options === null || options === void 0 ? void 0 : options.emailRedirectTo, flowId),
              body: Object.assign(Object.assign({}, attributes), { code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }),
              jwt: session.access_token,
              xform: fetch_1._userResponse
            });
            if (userError) {
              throw userError;
            }
            session.user = data.user;
            await this._saveSession(session);
            await this._notifyAllSubscribers("USER_UPDATED", session);
            return this._returnResult({ data: { user: session.user }, error: null });
          });
        } catch (error) {
          await (0, helpers_1.removePKCEVerifier)(this.storage, this.storageKey, flowId);
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { user: null }, error });
          }
          throw error;
        }
      }
      /**
       * Sets the session data from the current session. If the current session is expired, setSession will take care of refreshing it to obtain a new session.
       * If the refresh token or access token in the current session is invalid, an error will be thrown.
       * @param currentSession The current session that minimally contains an access token and refresh token.
       *
       * @category Auth
       *
       * @remarks
       * - This method sets the session using an `access_token` and `refresh_token`.
       * - If successful, a `SIGNED_IN` event is emitted.
       *
       * @exampleDescription Set the session
       * Sets the session data from an access_token and refresh_token, then returns an auth response or error.
       *
       * @example Set the session
       * ```js
       *   const { data, error } = await supabase.auth.setSession({
       *     access_token,
       *     refresh_token
       *   })
       * ```
       *
       * @exampleResponse Set the session
       * ```json
       * {
       *   "data": {
       *     "user": {
       *       "id": "11111111-1111-1111-1111-111111111111",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "email": "example@email.com",
       *       "email_confirmed_at": "2024-01-01T00:00:00Z",
       *       "phone": "",
       *       "confirmed_at": "2024-01-01T00:00:00Z",
       *       "last_sign_in_at": "2024-01-01T00:00:00Z",
       *       "app_metadata": {
       *         "provider": "email",
       *         "providers": [
       *           "email"
       *         ]
       *       },
       *       "user_metadata": {
       *         "email": "example@email.com",
       *         "email_verified": false,
       *         "phone_verified": false,
       *         "sub": "11111111-1111-1111-1111-111111111111"
       *       },
       *       "identities": [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "11111111-1111-1111-1111-111111111111",
       *           "user_id": "11111111-1111-1111-1111-111111111111",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": false,
       *             "phone_verified": false,
       *             "sub": "11111111-1111-1111-1111-111111111111"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "example@email.com"
       *         }
       *       ],
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z",
       *       "is_anonymous": false
       *     },
       *     "session": {
       *       "access_token": "<ACCESS_TOKEN>",
       *       "refresh_token": "<REFRESH_TOKEN>",
       *       "user": {
       *         "id": "11111111-1111-1111-1111-111111111111",
       *         "aud": "authenticated",
       *         "role": "authenticated",
       *         "email": "example@email.com",
       *         "email_confirmed_at": "2024-01-01T00:00:00Z",
       *         "phone": "",
       *         "confirmed_at": "2024-01-01T00:00:00Z",
       *         "last_sign_in_at": "11111111-1111-1111-1111-111111111111",
       *         "app_metadata": {
       *           "provider": "email",
       *           "providers": [
       *             "email"
       *           ]
       *         },
       *         "user_metadata": {
       *           "email": "example@email.com",
       *           "email_verified": false,
       *           "phone_verified": false,
       *           "sub": "11111111-1111-1111-1111-111111111111"
       *         },
       *         "identities": [
       *           {
       *             "identity_id": "2024-01-01T00:00:00Z",
       *             "id": "11111111-1111-1111-1111-111111111111",
       *             "user_id": "11111111-1111-1111-1111-111111111111",
       *             "identity_data": {
       *               "email": "example@email.com",
       *               "email_verified": false,
       *               "phone_verified": false,
       *               "sub": "11111111-1111-1111-1111-111111111111"
       *             },
       *             "provider": "email",
       *             "last_sign_in_at": "2024-01-01T00:00:00Z",
       *             "created_at": "2024-01-01T00:00:00Z",
       *             "updated_at": "2024-01-01T00:00:00Z",
       *             "email": "example@email.com"
       *           }
       *         ],
       *         "created_at": "2024-01-01T00:00:00Z",
       *         "updated_at": "2024-01-01T00:00:00Z",
       *         "is_anonymous": false
       *       },
       *       "token_type": "bearer",
       *       "expires_in": 3500,
       *       "expires_at": 1700000000
       *     }
       *   },
       *   "error": null
       * }
       * ```
       */
      async setSession(currentSession) {
        await this.initializePromise;
        if (this.lock != null) {
          return await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._setSession(currentSession);
          });
        }
        return await this._setSession(currentSession);
      }
      async _setSession(currentSession) {
        try {
          if (!currentSession.access_token || !currentSession.refresh_token) {
            throw new errors_1.AuthSessionMissingError();
          }
          const timeNow = Date.now() / 1e3;
          let expiresAt = timeNow;
          let hasExpired = true;
          let session = null;
          const { payload } = (0, helpers_1.decodeJWT)(currentSession.access_token);
          if (payload.exp) {
            expiresAt = payload.exp;
            hasExpired = expiresAt <= timeNow;
          }
          if (hasExpired) {
            const { data: refreshedSession, error } = await this._callRefreshToken(currentSession.refresh_token);
            if (error) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            if (!refreshedSession) {
              return { data: { user: null, session: null }, error: null };
            }
            session = refreshedSession;
          } else {
            const { data, error } = await this._getUser(currentSession.access_token);
            if (error) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            session = {
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token,
              user: data.user,
              token_type: "bearer",
              expires_in: expiresAt - timeNow,
              expires_at: expiresAt
            };
            await this._saveSession(session);
            await this._notifyAllSubscribers("SIGNED_IN", session);
          }
          return this._returnResult({ data: { user: session.user, session }, error: null });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { session: null, user: null }, error });
          }
          throw error;
        }
      }
      /**
       * Returns a new session, regardless of expiry status.
       * Takes in an optional current session. If not passed in, then refreshSession() will attempt to retrieve it from getSession().
       * If the current session's refresh token is invalid, an error will be thrown.
       * @param currentSession The current session. If passed in, it must contain a refresh token.
       *
       * @category Auth
       *
       * @remarks
       * - This method will refresh and return a new session whether the current one is expired or not.
       *
       * @example Refresh session using the current session
       * ```js
       * const { data, error } = await supabase.auth.refreshSession()
       * const { session, user } = data
       * ```
       *
       * @exampleResponse Refresh session using the current session
       * ```json
       * {
       *   "data": {
       *     "user": {
       *       "id": "11111111-1111-1111-1111-111111111111",
       *       "aud": "authenticated",
       *       "role": "authenticated",
       *       "email": "example@email.com",
       *       "email_confirmed_at": "2024-01-01T00:00:00Z",
       *       "phone": "",
       *       "confirmed_at": "2024-01-01T00:00:00Z",
       *       "last_sign_in_at": "2024-01-01T00:00:00Z",
       *       "app_metadata": {
       *         "provider": "email",
       *         "providers": [
       *           "email"
       *         ]
       *       },
       *       "user_metadata": {
       *         "email": "example@email.com",
       *         "email_verified": false,
       *         "phone_verified": false,
       *         "sub": "11111111-1111-1111-1111-111111111111"
       *       },
       *       "identities": [
       *         {
       *           "identity_id": "22222222-2222-2222-2222-222222222222",
       *           "id": "11111111-1111-1111-1111-111111111111",
       *           "user_id": "11111111-1111-1111-1111-111111111111",
       *           "identity_data": {
       *             "email": "example@email.com",
       *             "email_verified": false,
       *             "phone_verified": false,
       *             "sub": "11111111-1111-1111-1111-111111111111"
       *           },
       *           "provider": "email",
       *           "last_sign_in_at": "2024-01-01T00:00:00Z",
       *           "created_at": "2024-01-01T00:00:00Z",
       *           "updated_at": "2024-01-01T00:00:00Z",
       *           "email": "example@email.com"
       *         }
       *       ],
       *       "created_at": "2024-01-01T00:00:00Z",
       *       "updated_at": "2024-01-01T00:00:00Z",
       *       "is_anonymous": false
       *     },
       *     "session": {
       *       "access_token": "<ACCESS_TOKEN>",
       *       "token_type": "bearer",
       *       "expires_in": 3600,
       *       "expires_at": 1700000000,
       *       "refresh_token": "<REFRESH_TOKEN>",
       *       "user": {
       *         "id": "11111111-1111-1111-1111-111111111111",
       *         "aud": "authenticated",
       *         "role": "authenticated",
       *         "email": "example@email.com",
       *         "email_confirmed_at": "2024-01-01T00:00:00Z",
       *         "phone": "",
       *         "confirmed_at": "2024-01-01T00:00:00Z",
       *         "last_sign_in_at": "2024-01-01T00:00:00Z",
       *         "app_metadata": {
       *           "provider": "email",
       *           "providers": [
       *             "email"
       *           ]
       *         },
       *         "user_metadata": {
       *           "email": "example@email.com",
       *           "email_verified": false,
       *           "phone_verified": false,
       *           "sub": "11111111-1111-1111-1111-111111111111"
       *         },
       *         "identities": [
       *           {
       *             "identity_id": "22222222-2222-2222-2222-222222222222",
       *             "id": "11111111-1111-1111-1111-111111111111",
       *             "user_id": "11111111-1111-1111-1111-111111111111",
       *             "identity_data": {
       *               "email": "example@email.com",
       *               "email_verified": false,
       *               "phone_verified": false,
       *               "sub": "11111111-1111-1111-1111-111111111111"
       *             },
       *             "provider": "email",
       *             "last_sign_in_at": "2024-01-01T00:00:00Z",
       *             "created_at": "2024-01-01T00:00:00Z",
       *             "updated_at": "2024-01-01T00:00:00Z",
       *             "email": "example@email.com"
       *           }
       *         ],
       *         "created_at": "2024-01-01T00:00:00Z",
       *         "updated_at": "2024-01-01T00:00:00Z",
       *         "is_anonymous": false
       *       }
       *     }
       *   },
       *   "error": null
       * }
       * ```
       *
       * @example Refresh session using a refresh token
       * ```js
       * const { data, error } = await supabase.auth.refreshSession({ refresh_token })
       * const { session, user } = data
       * ```
       */
      async refreshSession(currentSession) {
        await this.initializePromise;
        if (this.lock != null) {
          return await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._refreshSession(currentSession);
          });
        }
        return await this._refreshSession(currentSession);
      }
      async _refreshSession(currentSession) {
        try {
          return await this._useSession(async (result) => {
            var _a;
            if (!currentSession) {
              const { data, error: error2 } = result;
              if (error2) {
                throw error2;
              }
              currentSession = (_a = data.session) !== null && _a !== void 0 ? _a : void 0;
            }
            if (!(currentSession === null || currentSession === void 0 ? void 0 : currentSession.refresh_token)) {
              throw new errors_1.AuthSessionMissingError();
            }
            const { data: session, error } = await this._callRefreshToken(currentSession.refresh_token);
            if (error) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            if (!session) {
              return this._returnResult({ data: { user: null, session: null }, error: null });
            }
            return this._returnResult({ data: { user: session.user, session }, error: null });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      }
      /**
       * Gets the session data from a URL string
       */
      async _getSessionFromURL(params, callbackUrlType) {
        var _a;
        try {
          if (!(0, helpers_1.isBrowser)())
            throw new errors_1.AuthImplicitGrantRedirectError("No browser detected.");
          if (params.error || params.error_description || params.error_code) {
            throw new errors_1.AuthImplicitGrantRedirectError(params.error_description || "Error in URL with unspecified error_description", {
              error: params.error || "unspecified_error",
              code: params.error_code || "unspecified_code"
            });
          }
          switch (callbackUrlType) {
            case "implicit":
              if (this.flowType === "pkce") {
                throw new errors_1.AuthPKCEGrantCodeExchangeError("Not a valid PKCE flow url.");
              }
              break;
            case "pkce":
              if (this.flowType === "implicit") {
                throw new errors_1.AuthImplicitGrantRedirectError("Not a valid implicit grant flow url.");
              }
              break;
            default:
          }
          if (callbackUrlType === "pkce") {
            this._debug("#_initialize()", "begin", "is PKCE flow", true);
            if (!params.code)
              throw new errors_1.AuthPKCEGrantCodeExchangeError("No code detected.");
            const { data: data2, error: error2 } = await this._exchangeCodeForSession(params.code, {
              flowId: params[constants_1.PKCE_FLOW_ID_PARAM]
            });
            if (error2)
              throw error2;
            const url = new URL(window.location.href);
            url.searchParams.delete("code");
            url.searchParams.delete(constants_1.PKCE_FLOW_ID_PARAM);
            window.history.replaceState(window.history.state, "", url.toString());
            return {
              data: { session: data2.session, redirectType: (_a = data2.redirectType) !== null && _a !== void 0 ? _a : null },
              error: null
            };
          }
          const { provider_token, provider_refresh_token, access_token, refresh_token, expires_in, expires_at, token_type } = params;
          if (!access_token || !expires_in || !refresh_token || !token_type) {
            throw new errors_1.AuthImplicitGrantRedirectError("No session defined in URL");
          }
          const timeNow = Math.round(Date.now() / 1e3);
          const expiresIn = parseInt(expires_in);
          let expiresAt = timeNow + expiresIn;
          if (expires_at) {
            expiresAt = parseInt(expires_at);
          }
          const actuallyExpiresIn = expiresAt - timeNow;
          if (actuallyExpiresIn * 1e3 <= constants_1.AUTO_REFRESH_TICK_DURATION_MS) {
            console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${actuallyExpiresIn}s, should have been closer to ${expiresIn}s`);
          }
          const issuedAt = expiresAt - expiresIn;
          if (timeNow - issuedAt >= 120) {
            console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", issuedAt, expiresAt, timeNow);
          } else if (timeNow - issuedAt < 0) {
            console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", issuedAt, expiresAt, timeNow);
          }
          const { data, error } = await this._getUser(access_token);
          if (error)
            throw error;
          const session = {
            provider_token,
            provider_refresh_token,
            access_token,
            expires_in: expiresIn,
            expires_at: expiresAt,
            refresh_token,
            token_type,
            user: data.user
          };
          window.location.hash = "";
          this._debug("#_getSessionFromURL()", "clearing window.location.hash");
          return this._returnResult({ data: { session, redirectType: params.type }, error: null });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { session: null, redirectType: null }, error });
          }
          throw error;
        }
      }
      /**
       * Checks if the current URL contains parameters given by an implicit oauth grant flow (https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2)
       *
       * If `detectSessionInUrl` is a function, it will be called with the URL and params to determine
       * if the URL should be processed as a Supabase auth callback. This allows users to exclude
       * URLs from other OAuth providers (e.g., Facebook Login) that also return access_token in the fragment.
       */
      _isImplicitGrantCallback(params) {
        if (typeof this.detectSessionInUrl === "function") {
          return this.detectSessionInUrl(new URL(window.location.href), params);
        }
        return Boolean(params.access_token || params.error || params.error_description || params.error_code);
      }
      /**
       * Checks if the current URL and backing storage contain parameters given by a PKCE flow
       */
      async _isPKCECallback(params) {
        if (!params.code) {
          return false;
        }
        const flowId = (0, helpers_1.validatePKCEFlowId)(params[constants_1.PKCE_FLOW_ID_PARAM]);
        if (flowId && await (0, helpers_1.getItemAsync)(this.storage, (0, helpers_1.pkceVerifierSlotKey)(this.storageKey, flowId))) {
          return true;
        }
        const currentStorageContent = await (0, helpers_1.getItemAsync)(this.storage, `${this.storageKey}-code-verifier`);
        return !!currentStorageContent;
      }
      /**
       * Inside a browser context, `signOut()` will remove the logged in user from the browser session
       * and log them out - removing all items from localstorage and then trigger a `"SIGNED_OUT"`
       * event.
       *
       * For server-side management, you can revoke all refresh tokens for a user by passing a user's
       * JWT through to `auth.api.signOut(JWT: string)`.
       *
       * There is no way to revoke a user's access token jwt until it expires. It is recommended to set
       * a shorter expiry on the jwt for this reason.
       *
       * `signOut` behavior depends on the selected scope:
       *
       * - `local`: The local session is removed first and a `SIGNED_OUT` event is fired, then the client
       *   makes a best-effort request to revoke the refresh token on the server. If the request fails,
       *   the client is still signed out locally and the error is returned, but the server may retain
       *   the refresh token until it expires.
       *
       * - `global`: All of the user's sessions are first invalidated on the server. Once the server
       *   acknowledges the request, the local session is cleared. If server logout fails, the local
       *   session is retained, no `SIGNED_OUT` event is triggered, and the server or network error is
       *   returned. A 401, 403, or 404 response counts as a successful sign-out.
       *
       * - `others`: All other sessions are invalidated when the server accepts the request; the
       *   current local session remains unchanged. In case of server or network failures, the error is
       *   returned. A `SIGNED_OUT` event is never triggered, regardless of the outcome.
       *
       * **Warning:** the default `scope` is `'global'`. This signs the user out of
       * **every device they are currently signed in on**, not just the current
       * tab/session. If you only want to sign the user out of the current session
       * (the behavior most other auth libraries default to), pass
       * `{ scope: 'local' }` explicitly.
       *
       * @category Auth
       *
       * @remarks
       * - In order to use the `signOut()` method, the user needs to be signed in first.
       * - By default, `signOut()` uses the **global** scope, which signs out the user
       *   on every device they are signed in on (not just the current one). Pass
       *   `{ scope: 'local' }` to only sign out the current session. This is
       *   usually what apps want on a "Sign out" button, especially when users
       *   sign in from multiple devices and do not expect signing out of one to
       *   terminate the others.
       * - With the default `global` scope, `signOut()` while offline returns an error and keeps the user
       *   signed in. To sign out regardless, fall back to `signOut({ scope: 'local' })` when the call
       *   returns an error.
       * - Since Supabase Auth uses JWTs for authentication, the access token JWT will be valid until
       *   it's expired. When the user signs out, Supabase revokes the refresh token and deletes the
       *   JWT from the client-side. This does not revoke the JWT and it will still be valid until it
       *   expires.
       *
       * @example Sign out of every device (global – default)
       * ```js
       * const { error } = await supabase.auth.signOut()
       * ```
       *
       * @example Sign out only the current session (recommended for most apps)
       * ```js
       * const { error } = await supabase.auth.signOut({ scope: 'local' })
       * ```
       *
       * @example Sign out of all other sessions, keep the current one
       * ```js
       * const { error } = await supabase.auth.signOut({ scope: 'others' })
       * ```
       */
      async signOut(options = { scope: "global" }) {
        await this.initializePromise;
        if (this.lock != null) {
          return await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._signOut(options);
          });
        }
        return await this._signOut(options);
      }
      async _signOut({ scope = "global" } = {}) {
        return await this._useSession(async (result) => {
          var _a;
          const removeCurrentSession = async () => {
            await this._removeSession();
          };
          const { data, error: sessionError } = result;
          if (sessionError && !(0, errors_1.isAuthSessionMissingError)(sessionError)) {
            if (scope === "local" && (0, errors_1.isAuthRetryableFetchError)(sessionError)) {
              await removeCurrentSession();
            }
            return this._returnResult({ error: sessionError });
          }
          const accessToken = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token;
          let removeError = null;
          const finish = (value) => {
            if (removeError) {
              throw removeError.thrown;
            }
            return value;
          };
          if (scope === "local") {
            try {
              await removeCurrentSession();
            } catch (thrown) {
              removeError = { thrown };
            }
          }
          if (accessToken) {
            const { error } = await this.admin.signOut(accessToken, scope);
            if (error && !((0, errors_1.isAuthApiError)(error) && (error.status === 404 || error.status === 401 || error.status === 403) || (0, errors_1.isAuthSessionMissingError)(error))) {
              return finish(this._returnResult({ error }));
            }
          }
          if (scope === "global") {
            await removeCurrentSession();
          }
          return finish(this._returnResult({ error: null }));
        });
      }
      /**  *
       * @category Auth
       *
       * @remarks
       * - Subscribes to important events occurring on the user's session.
       * - Use on the frontend/client. It is less useful on the server.
       * - Events are emitted across tabs to keep your application's UI up-to-date. Some events can fire very frequently, based on the number of tabs open. Use a quick and efficient callback function, and defer or debounce as many operations as you can to be performed outside of the callback.
       * - Callbacks can be `async` and can safely call other Supabase auth methods (`getUser`, `setSession`, etc.) from inside the callback.
       * - Keep callbacks quick. Events are awaited in order, so a slow callback delays subsequent events to subscribers in this tab.
       * - Emitted events:
       *   - `INITIAL_SESSION`
       *     - Emitted right after the Supabase client is constructed and the initial session from storage is loaded.
       *   - `SIGNED_IN`
       *     - Emitted each time a user session is confirmed or re-established, including on user sign in and when refocusing a tab.
       *     - Avoid making assumptions as to when this event is fired, this may occur even when the user is already signed in. Instead, check the user object attached to the event to see if a new user has signed in and update your application's UI.
       *     - This event can fire very frequently depending on the number of tabs open in your application.
       *   - `SIGNED_OUT`
       *     - Emitted when the user signs out. This can be after:
       *       - A call to `supabase.auth.signOut()`.
       *       - After the user's session has expired for any reason:
       *         - User has signed out on another device.
       *         - The session has reached its timebox limit or inactivity timeout.
       *         - User has signed in on another device with single session per user enabled.
       *         - Check the [User Sessions](/docs/guides/auth/sessions) docs for more information.
       *     - Use this to clean up any local storage your application has associated with the user.
       *   - `TOKEN_REFRESHED`
       *     - Emitted each time a new access and refresh token are fetched for the signed in user.
       *     - It's best practice and highly recommended to extract the access token (JWT) and store it in memory for further use in your application.
       *       - Avoid frequent calls to `supabase.auth.getSession()` for the same purpose.
       *     - There is a background process that keeps track of when the session should be refreshed so you will always receive valid tokens by listening to this event.
       *     - The frequency of this event is related to the JWT expiry limit configured on your project.
       *   - `USER_UPDATED`
       *     - Emitted each time the `supabase.auth.updateUser()` method finishes successfully. Listen to it to update your application's UI based on new profile information.
       *   - `PASSWORD_RECOVERY`
       *     - Emitted instead of the `SIGNED_IN` event when the user lands on a page that includes a password recovery link in the URL.
       *     - Use it to show a UI to the user where they can [reset their password](/docs/guides/auth/passwords#resetting-a-users-password-forgot-password).
       *
       * @example Listen to auth changes
       * ```js
       * const { data } = supabase.auth.onAuthStateChange((event, session) => {
       *   console.log(event, session)
       *
       *   if (event === 'INITIAL_SESSION') {
       *     // handle initial session
       *   } else if (event === 'SIGNED_IN') {
       *     // handle sign in event
       *   } else if (event === 'SIGNED_OUT') {
       *     // handle sign out event
       *   } else if (event === 'PASSWORD_RECOVERY') {
       *     // handle password recovery event
       *   } else if (event === 'TOKEN_REFRESHED') {
       *     // handle token refreshed event
       *   } else if (event === 'USER_UPDATED') {
       *     // handle user updated event
       *   }
       * })
       *
       * // call unsubscribe to remove the callback
       * data.subscription.unsubscribe()
       * ```
       *
       * @exampleDescription Listen to sign out
       * Make sure you clear out any local data, such as local and session storage, after the client library has detected the user's sign out.
       *
       * @example Listen to sign out
       * ```js
       * supabase.auth.onAuthStateChange((event, session) => {
       *   if (event === 'SIGNED_OUT') {
       *     console.log('SIGNED_OUT', session)
       *
       *     // clear local and session storage
       *     [
       *       window.localStorage,
       *       window.sessionStorage,
       *     ].forEach((storage) => {
       *       Object.entries(storage)
       *         .forEach(([key]) => {
       *           storage.removeItem(key)
       *         })
       *     })
       *   }
       * })
       * ```
       *
       * @exampleDescription Store OAuth provider tokens on sign in
       * When using [OAuth (social sign-in)](/docs/guides/auth/social-sign-in) you sometimes wish to get access to the provider's access token and refresh token, in order to call provider APIs in the name of the user.
       *
       * For example, if you are using [Sign in with Google](/docs/guides/auth/social-sign-in/auth-google) you may want to use the provider token to call Google APIs on behalf of the user. Supabase Auth does not keep track of the provider access and refresh token, but does return them for you once, immediately after sign in. You can use the `onAuthStateChange` method to listen for the presence of the provider tokens and store them in local storage. You can further send them to your server's APIs for use on the backend.
       *
       * Finally, make sure you remove them from local storage on the `SIGNED_OUT` event. If the OAuth provider supports token revocation, make sure you call those APIs either from the frontend or schedule them to be called on the backend.
       *
       * @example Store OAuth provider tokens on sign in
       * ```js
       * // Register this immediately after calling createClient!
       * // Because signInWithOAuth causes a redirect, you need to fetch the
       * // provider tokens from the callback.
       * supabase.auth.onAuthStateChange((event, session) => {
       *   if (session && session.provider_token) {
       *     window.localStorage.setItem('oauth_provider_token', session.provider_token)
       *   }
       *
       *   if (session && session.provider_refresh_token) {
       *     window.localStorage.setItem('oauth_provider_refresh_token', session.provider_refresh_token)
       *   }
       *
       *   if (event === 'SIGNED_OUT') {
       *     window.localStorage.removeItem('oauth_provider_token')
       *     window.localStorage.removeItem('oauth_provider_refresh_token')
       *   }
       * })
       * ```
       *
       * @exampleDescription Use React Context for the User's session
       * Instead of relying on `supabase.auth.getSession()` within your React components, you can use a [React Context](https://react.dev/reference/react/createContext) to store the latest session information from the `onAuthStateChange` callback and access it that way.
       *
       * @example Use React Context for the User's session
       * ```js
       * const SessionContext = React.createContext(null)
       *
       * function main() {
       *   const [session, setSession] = React.useState(null)
       *
       *   React.useEffect(() => {
       *     const {data: { subscription }} = supabase.auth.onAuthStateChange(
       *       (event, session) => {
       *         if (event === 'SIGNED_OUT') {
       *           setSession(null)
       *         } else if (session) {
       *           setSession(session)
       *         }
       *       })
       *
       *     return () => {
       *       subscription.unsubscribe()
       *     }
       *   }, [])
       *
       *   return (
       *     <SessionContext.Provider value={session}>
       *       <App />
       *     </SessionContext.Provider>
       *   )
       * }
       * ```
       *
       * @example Listen to password recovery events
       * ```js
       * supabase.auth.onAuthStateChange((event, session) => {
       *   if (event === 'PASSWORD_RECOVERY') {
       *     console.log('PASSWORD_RECOVERY', session)
       *     // show screen to update user's password
       *     showPasswordResetScreen(true)
       *   }
       * })
       * ```
       *
       * @example Listen to sign in
       * ```js
       * supabase.auth.onAuthStateChange((event, session) => {
       *   if (event === 'SIGNED_IN') console.log('SIGNED_IN', session)
       * })
       * ```
       *
       * @example Listen to token refresh
       * ```js
       * supabase.auth.onAuthStateChange((event, session) => {
       *   if (event === 'TOKEN_REFRESHED') console.log('TOKEN_REFRESHED', session)
       * })
       * ```
       *
       * @example Listen to user updates
       * ```js
       * supabase.auth.onAuthStateChange((event, session) => {
       *   if (event === 'USER_UPDATED') console.log('USER_UPDATED', session)
       * })
       * ```
       */
      onAuthStateChange(callback) {
        const id = (0, helpers_1.generateCallbackId)();
        const subscription = {
          id,
          callback,
          unsubscribe: () => {
            this._debug("#unsubscribe()", "state change callback with id removed", id);
            this.stateChangeEmitters.delete(id);
          }
        };
        this._debug("#onAuthStateChange()", "registered callback with id", id);
        this.stateChangeEmitters.set(id, subscription);
        (async () => {
          await this.initializePromise;
          if (this.lock != null) {
            await this._acquireLock(this.lockAcquireTimeout, async () => {
              this._emitInitialSession(id);
            });
          } else {
            await this._emitInitialSession(id);
          }
        })();
        return { data: { subscription } };
      }
      async _emitInitialSession(id) {
        return await this._useSession(async (result) => {
          var _a, _b;
          try {
            const { data: { session }, error } = result;
            if (error)
              throw error;
            await ((_a = this.stateChangeEmitters.get(id)) === null || _a === void 0 ? void 0 : _a.callback("INITIAL_SESSION", session));
            this._debug("INITIAL_SESSION", "callback id", id, "session", session);
          } catch (err) {
            await ((_b = this.stateChangeEmitters.get(id)) === null || _b === void 0 ? void 0 : _b.callback("INITIAL_SESSION", null));
            this._debug("INITIAL_SESSION", "callback id", id, "error", err);
            if ((0, errors_1.isAuthRefreshDiscardedError)(err)) {
              return;
            }
            if ((0, errors_1.isAuthSessionMissingError)(err) || (0, errors_1.isAuthRetryableFetchError)(err) || (0, errors_1.isAuthApiError)(err) && (err.code === "refresh_token_not_found" || err.code === "refresh_token_already_used" || err.code === "session_expired")) {
              console.warn(err);
            } else {
              console.error(err);
            }
          }
        });
      }
      /**
       * Sends a password reset request to an email address. This method supports the PKCE flow.
       *
       * @param email The email address of the user.
       * @param options.redirectTo The URL to send the user to after they click the password reset link.
       * @param options.captchaToken Verification token received when the user completes the captcha on the site.
       *
       * @category Auth
       *
       * @remarks
       * - The password reset flow consist of 2 broad steps: (i) Allow the user to login via the password reset link; (ii) Update the user's password.
       * - The `resetPasswordForEmail()` only sends a password reset link to the user's email.
       * To update the user's password, see [`updateUser()`](/docs/reference/javascript/auth-updateuser).
       * - A `PASSWORD_RECOVERY` event will be emitted when the password recovery link is clicked.
       * You can use [`onAuthStateChange()`](/docs/reference/javascript/auth-onauthstatechange) to listen and invoke a callback function on these events.
       * - When the user clicks the reset link in the email they are redirected back to your application.
       * You can configure the URL that the user is redirected to with the `redirectTo` parameter.
       * See [redirect URLs and wildcards](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.
       * - After the user has been redirected successfully, prompt them for a new password and call `updateUser()`:
       * ```js
       * const { data, error } = await supabase.auth.updateUser({
       *   password: new_password
       * })
       * ```
       *
       * @example Reset password
       * ```js
       * const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
       *   redirectTo: 'https://example.com/update-password',
       * })
       * ```
       *
       * @exampleResponse Reset password
       * ```json
       * {
       *   data: {}
       *   error: null
       * }
       * ```
       *
       * @example Reset password (React)
       * ```js
       * /**
       *  * Step 1: Send the user an email to get a password reset token.
       *  * This email contains a link which sends the user back to your application.
       *  *\/
       * const { data, error } = await supabase.auth
       *   .resetPasswordForEmail('user@email.com')
       *
       * /**
       *  * Step 2: Once the user is redirected back to your application,
       *  * ask the user to reset their password.
       *  *\/
       *  useEffect(() => {
       *    supabase.auth.onAuthStateChange(async (event, session) => {
       *      if (event == "PASSWORD_RECOVERY") {
       *        const newPassword = prompt("What would you like your new password to be?");
       *        const { data, error } = await supabase.auth
       *          .updateUser({ password: newPassword })
       *
       *        if (data) alert("Password updated successfully!")
       *        if (error) alert("There was an error updating your password.")
       *      }
       *    })
       *  }, [])
       * ```
       */
      async resetPasswordForEmail(email, options = {}) {
        let codeChallenge = null;
        let codeChallengeMethod = null;
        let flowId = null;
        if (this.flowType === "pkce") {
          ;
          [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod(
            true
            // isPasswordRecovery
          );
        }
        try {
          return await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/recover`, {
            body: {
              email,
              code_challenge: codeChallenge,
              code_challenge_method: codeChallengeMethod,
              gotrue_meta_security: { captcha_token: options.captchaToken }
            },
            headers: this.headers,
            redirectTo: this._maybeAppendFlowIdToRedirect(options.redirectTo, flowId)
          });
        } catch (error) {
          await (0, helpers_1.removePKCEVerifier)(this.storage, this.storageKey, flowId);
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Gets all the identities linked to a user.
       *
       * @category Auth
       *
       * @remarks
       * - The user needs to be signed in to call `getUserIdentities()`.
       *
       * @example Returns a list of identities linked to the user
       * ```js
       * const { data, error } = await supabase.auth.getUserIdentities()
       * ```
       *
       * @exampleResponse Returns a list of identities linked to the user
       * ```json
       * {
       *   "data": {
       *     "identities": [
       *       {
       *         "identity_id": "22222222-2222-2222-2222-222222222222",
       *         "id": "2024-01-01T00:00:00Z",
       *         "user_id": "2024-01-01T00:00:00Z",
       *         "identity_data": {
       *           "email": "example@email.com",
       *           "email_verified": false,
       *           "phone_verified": false,
       *           "sub": "11111111-1111-1111-1111-111111111111"
       *         },
       *         "provider": "email",
       *         "last_sign_in_at": "2024-01-01T00:00:00Z",
       *         "created_at": "2024-01-01T00:00:00Z",
       *         "updated_at": "2024-01-01T00:00:00Z",
       *         "email": "example@email.com"
       *       }
       *     ]
       *   },
       *   "error": null
       * }
       * ```
       */
      async getUserIdentities() {
        var _a;
        try {
          const { data, error } = await this.getUser();
          if (error)
            throw error;
          return this._returnResult({ data: { identities: (_a = data.user.identities) !== null && _a !== void 0 ? _a : [] }, error: null });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**  *
       * @category Auth
       *
       * @remarks
       * - The **Enable Manual Linking** option must be enabled from your [project's authentication settings](/dashboard/project/_/auth/providers).
       * - The user needs to be signed in to call `linkIdentity()`.
       * - If the candidate identity is already linked to the existing user or another user, `linkIdentity()` will fail.
       * - If `linkIdentity` is run in the browser, the user is automatically redirected to the returned URL. On the server, you should handle the redirect.
       *
       * @example Link an identity to a user
       * ```js
       * const { data, error } = await supabase.auth.linkIdentity({
       *   provider: 'github'
       * })
       * ```
       *
       * @exampleResponse Link an identity to a user
       * ```json
       * {
       *   data: {
       *     provider: 'github',
       *     url: <PROVIDER_URL_TO_REDIRECT_TO>,
       *     flowId: <PKCE_FLOW_ID_OR_NULL>
       *   },
       *   error: null
       * }
       * ```
       */
      async linkIdentity(credentials) {
        if ("token" in credentials) {
          return this.linkIdentityIdToken(credentials);
        }
        return this.linkIdentityOAuth(credentials);
      }
      async linkIdentityOAuth(credentials) {
        var _a;
        let flowId = null;
        try {
          const { data, error } = await this._useSession(async (result) => {
            var _a2, _b, _c, _d, _f;
            const { data: data2, error: error2 } = result;
            if (error2)
              throw error2;
            const { url, flowId: urlFlowId } = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, credentials.provider, {
              redirectTo: (_a2 = credentials.options) === null || _a2 === void 0 ? void 0 : _a2.redirectTo,
              scopes: (_b = credentials.options) === null || _b === void 0 ? void 0 : _b.scopes,
              queryParams: (_c = credentials.options) === null || _c === void 0 ? void 0 : _c.queryParams,
              skipBrowserRedirect: true
            });
            flowId = urlFlowId;
            return await (0, fetch_1._request)(this.fetch, "GET", url, {
              headers: this.headers,
              jwt: (_f = (_d = data2.session) === null || _d === void 0 ? void 0 : _d.access_token) !== null && _f !== void 0 ? _f : void 0
            });
          });
          if (error)
            throw error;
          if ((0, helpers_1.isBrowser)() && !((_a = credentials.options) === null || _a === void 0 ? void 0 : _a.skipBrowserRedirect)) {
            window.location.assign(data === null || data === void 0 ? void 0 : data.url);
          }
          return this._returnResult({
            data: { provider: credentials.provider, url: data === null || data === void 0 ? void 0 : data.url, flowId },
            error: null
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({
              data: { provider: credentials.provider, url: null, flowId },
              error
            });
          }
          throw error;
        }
      }
      async linkIdentityIdToken(credentials) {
        return await this._useSession(async (result) => {
          var _a;
          try {
            const { error: sessionError, data: { session } } = result;
            if (sessionError)
              throw sessionError;
            const { options, provider, token, access_token, nonce } = credentials;
            const res = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
              headers: this.headers,
              jwt: (_a = session === null || session === void 0 ? void 0 : session.access_token) !== null && _a !== void 0 ? _a : void 0,
              body: {
                provider,
                id_token: token,
                access_token,
                nonce,
                link_identity: true,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
              },
              xform: fetch_1._sessionResponse
            });
            const { data, error } = res;
            if (error) {
              return this._returnResult({ data: { user: null, session: null }, error });
            } else if (!data || !data.session || !data.user) {
              return this._returnResult({
                data: { user: null, session: null },
                error: new errors_1.AuthInvalidTokenResponseError()
              });
            }
            if (data.session) {
              await this._saveSession(data.session);
              await this._notifyAllSubscribers("USER_UPDATED", data.session);
            }
            return this._returnResult({ data, error });
          } catch (error) {
            await (0, helpers_1.removePKCEVerifier)(this.storage, this.storageKey, null);
            if ((0, errors_1.isAuthError)(error)) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            throw error;
          }
        });
      }
      /**
       * Unlinks an identity from a user by deleting it. The user will no longer be able to sign in with that identity once it's unlinked.
       *
       * @category Auth
       *
       * @remarks
       * - The **Enable Manual Linking** option must be enabled from your [project's authentication settings](/dashboard/project/_/auth/providers).
       * - The user needs to be signed in to call `unlinkIdentity()`.
       * - The user must have at least 2 identities in order to unlink an identity.
       * - The identity to be unlinked must belong to the user.
       *
       * @example Unlink an identity
       * ```js
       * // retrieve all identities linked to a user
       * const identities = await supabase.auth.getUserIdentities()
       *
       * // find the google identity
       * const googleIdentity = identities.find(
       *   identity => identity.provider === 'google'
       * )
       *
       * // unlink the google identity
       * const { error } = await supabase.auth.unlinkIdentity(googleIdentity)
       * ```
       */
      async unlinkIdentity(identity) {
        try {
          return await this._useSession(async (result) => {
            var _a, _b;
            const { data, error } = result;
            if (error) {
              throw error;
            }
            return await (0, fetch_1._request)(this.fetch, "DELETE", `${this.url}/user/identities/${identity.identity_id}`, {
              headers: this.headers,
              jwt: (_b = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : void 0
            });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Generates a new JWT.
       * @param refreshToken A valid refresh token that was returned on login.
       */
      async _refreshAccessToken(refreshToken) {
        const debugName = `#_refreshAccessToken()`;
        this._debug(debugName, "begin");
        try {
          const startedAt = Date.now();
          return await (0, helpers_1.retryable)(async (attempt) => {
            if (attempt > 0) {
              await (0, helpers_1.sleep)(200 * Math.pow(2, attempt - 1));
            }
            this._debug(debugName, "refreshing attempt", attempt);
            return await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
              body: { refresh_token: refreshToken },
              headers: this.headers,
              xform: fetch_1._sessionResponse
            });
          }, (attempt, error) => {
            const nextBackOffInterval = 200 * Math.pow(2, attempt);
            return error && (0, errors_1.isAuthRetryableFetchError)(error) && // retryable only if the request can be sent before the backoff overflows the tick duration
            Date.now() + nextBackOffInterval - startedAt < constants_1.AUTO_REFRESH_TICK_DURATION_MS;
          });
        } catch (error) {
          this._debug(debugName, "error", error);
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: { session: null, user: null }, error });
          }
          throw error;
        } finally {
          this._debug(debugName, "end");
        }
      }
      _isValidSession(maybeSession) {
        const isValidSession = typeof maybeSession === "object" && maybeSession !== null && "access_token" in maybeSession && "refresh_token" in maybeSession && "expires_at" in maybeSession;
        return isValidSession;
      }
      async _handleProviderSignIn(provider, options) {
        const { url, flowId } = await this._getUrlForProvider(`${this.url}/authorize`, provider, {
          redirectTo: options.redirectTo,
          scopes: options.scopes,
          queryParams: options.queryParams
        });
        this._debug("#_handleProviderSignIn()", "provider", provider, "options", options, "url", url);
        if ((0, helpers_1.isBrowser)() && !options.skipBrowserRedirect) {
          window.location.assign(url);
        }
        return { data: { provider, url, flowId }, error: null };
      }
      /**
       * Recovers the session from LocalStorage and refreshes the token
       * Note: this method is async to accommodate for AsyncStorage e.g. in React native.
       */
      async _recoverAndRefresh() {
        var _a, _b;
        const debugName = "#_recoverAndRefresh()";
        this._debug(debugName, "begin");
        try {
          const currentSession = await (0, helpers_1.getItemAsync)(this.storage, this.storageKey);
          if (currentSession && this.userStorage) {
            let maybeUser = await (0, helpers_1.getItemAsync)(this.userStorage, this.storageKey + "-user");
            if (!this.storage.isServer && Object.is(this.storage, this.userStorage) && !maybeUser) {
              maybeUser = { user: currentSession.user };
              await (0, helpers_1.setItemAsync)(this.userStorage, this.storageKey + "-user", maybeUser);
            }
            currentSession.user = (_a = maybeUser === null || maybeUser === void 0 ? void 0 : maybeUser.user) !== null && _a !== void 0 ? _a : (0, helpers_1.userNotAvailableProxy)();
          } else if (currentSession && !currentSession.user) {
            if (!currentSession.user) {
              const separateUser = await (0, helpers_1.getItemAsync)(this.storage, this.storageKey + "-user");
              if (separateUser && (separateUser === null || separateUser === void 0 ? void 0 : separateUser.user)) {
                currentSession.user = separateUser.user;
                await (0, helpers_1.removeItemAsync)(this.storage, this.storageKey + "-user");
                await (0, helpers_1.setItemAsync)(this.storage, this.storageKey, currentSession);
              } else {
                currentSession.user = (0, helpers_1.userNotAvailableProxy)();
              }
            }
          }
          this._debug(debugName, "session from storage", currentSession);
          if (!this._isValidSession(currentSession)) {
            this._debug(debugName, "session is not valid");
            if (currentSession !== null) {
              await this._removeSession();
            }
            return;
          }
          const expiresWithMargin = ((_b = currentSession.expires_at) !== null && _b !== void 0 ? _b : Infinity) * 1e3 - Date.now() < constants_1.EXPIRY_MARGIN_MS;
          this._debug(debugName, `session has${expiresWithMargin ? "" : " not"} expired with margin of ${constants_1.EXPIRY_MARGIN_MS}s`);
          if (expiresWithMargin) {
            if (this.autoRefreshToken && currentSession.refresh_token) {
              const { error } = await this._callRefreshToken(currentSession.refresh_token);
              if (error) {
                if ((0, errors_1.isAuthRefreshDiscardedError)(error)) {
                  this._debug(debugName, "refresh discarded by commit guard", error);
                } else {
                  this._debug(debugName, "refresh failed", error);
                }
              }
            }
          } else if (currentSession.user && currentSession.user.__isUserNotAvailableProxy === true) {
            try {
              const { data, error: userError } = await this._getUser(currentSession.access_token);
              if (!userError && (data === null || data === void 0 ? void 0 : data.user)) {
                currentSession.user = data.user;
                await this._saveSession(currentSession);
                await this._notifyAllSubscribers("SIGNED_IN", currentSession);
              } else {
                this._debug(debugName, "could not get user data, skipping SIGNED_IN notification");
              }
            } catch (getUserError) {
              console.error("Error getting user data:", getUserError);
              this._debug(debugName, "error getting user data, skipping SIGNED_IN notification", getUserError);
            }
          } else {
            await this._notifyAllSubscribers("SIGNED_IN", currentSession);
          }
        } catch (err) {
          this._debug(debugName, "error", err);
          if ((0, errors_1.isAuthRetryableFetchError)(err)) {
            console.warn(err);
          } else {
            console.error(err);
          }
          return;
        } finally {
          this._debug(debugName, "end");
        }
      }
      async _callRefreshToken(refreshToken) {
        var _a, _b;
        if (!refreshToken) {
          throw new errors_1.AuthSessionMissingError();
        }
        if (this.refreshingDeferred) {
          return this.refreshingDeferred.promise;
        }
        if (this.lastRefreshFailure && this.lastRefreshFailure.refreshToken === refreshToken && Date.now() < this.lastRefreshFailure.expiresAt) {
          this._debug("#_callRefreshToken()", "returning cached failure (cooldown active)");
          return this.lastRefreshFailure.result;
        }
        const debugName = `#_callRefreshToken()`;
        this._debug(debugName, "begin");
        try {
          this.refreshingDeferred = new helpers_1.Deferred();
          this.refreshingDeferred.promise.then(void 0, () => {
          });
          const storedAtStart = await (0, helpers_1.getItemAsync)(this.storage, this.storageKey);
          const { data, error } = await this._refreshAccessToken(refreshToken);
          if (error)
            throw error;
          if (!data.session)
            throw new errors_1.AuthSessionMissingError();
          const storedAfter = await (0, helpers_1.getItemAsync)(this.storage, this.storageKey);
          const storageChangedUnderUs = storedAtStart !== null && (storedAfter === null || storedAfter.refresh_token !== storedAtStart.refresh_token);
          if (storageChangedUnderUs) {
            this._debug(debugName, "commit guard: storage changed since refresh started, discarding rotated tokens", {
              // Presence indicators only — never log refresh token fragments,
              // even partial. Logs may be forwarded to third-party services.
              startedWith: "present",
              nowHolds: storedAfter ? "replaced" : "cleared"
            });
            const discarded = {
              data: null,
              error: new errors_1.AuthRefreshDiscardedError()
            };
            this.refreshingDeferred.resolve(discarded);
            return discarded;
          }
          const epochBeforeSave = this._sessionRemovalEpoch;
          await this._saveSession(data.session);
          if (this._sessionRemovalEpoch !== epochBeforeSave) {
            this._debug(debugName, "commit guard (post-save): _removeSession ran during _saveSession, undoing write");
            await (0, helpers_1.removeItemAsync)(this.storage, this.storageKey);
            if (this.userStorage) {
              await (0, helpers_1.removeItemAsync)(this.userStorage, this.storageKey + "-user");
            }
            const discarded = {
              data: null,
              error: new errors_1.AuthRefreshDiscardedError()
            };
            this.refreshingDeferred.resolve(discarded);
            return discarded;
          }
          await this._notifyAllSubscribers("TOKEN_REFRESHED", data.session);
          const result = { data: data.session, error: null };
          this.lastRefreshFailure = null;
          this.refreshingDeferred.resolve(result);
          return result;
        } catch (error) {
          this._debug(debugName, "error", error);
          if ((0, errors_1.isAuthError)(error)) {
            const result = { data: null, error };
            if (!(0, errors_1.isAuthRetryableFetchError)(error)) {
              const storedNow = await (0, helpers_1.getItemAsync)(this.storage, this.storageKey);
              const accessTokenStillValid = !!((storedNow === null || storedNow === void 0 ? void 0 : storedNow.expires_at) && storedNow.expires_at * 1e3 > Date.now());
              if (accessTokenStillValid) {
                this._debug(debugName, "proactive refresh failed, access token still valid \u2014 preserving session");
              } else {
                await this._removeSession();
              }
            }
            this.lastRefreshFailure = {
              refreshToken,
              result,
              expiresAt: Date.now() + constants_1.REFRESH_FAILURE_COOLDOWN_MS
            };
            (_a = this.refreshingDeferred) === null || _a === void 0 ? void 0 : _a.resolve(result);
            return result;
          }
          (_b = this.refreshingDeferred) === null || _b === void 0 ? void 0 : _b.reject(error);
          throw error;
        } finally {
          this.refreshingDeferred = null;
          this._debug(debugName, "end");
        }
      }
      async _notifyAllSubscribers(event, session, broadcast = true) {
        if (this._pendingInitNotifications !== null && broadcast) {
          this._pendingInitNotifications.push({ event, session, broadcast });
          return;
        }
        const debugName = `#_notifyAllSubscribers(${event})`;
        this._debug(debugName, "begin", session, `broadcast = ${broadcast}`);
        try {
          if (this.broadcastChannel && broadcast) {
            this.broadcastChannel.postMessage({ event, session });
          }
          const errors = [];
          const promises = Array.from(this.stateChangeEmitters.values()).map(async (x) => {
            try {
              await x.callback(event, session);
            } catch (e) {
              errors.push(e);
            }
          });
          await Promise.all(promises);
          if (errors.length > 0) {
            for (let i = 0; i < errors.length; i += 1) {
              console.error(errors[i]);
            }
            throw errors[0];
          }
        } finally {
          this._debug(debugName, "end");
        }
      }
      /**
       * set currentSession and currentUser
       * process to _startAutoRefreshToken if possible
       */
      async _saveSession(session) {
        this._debug("#_saveSession()", session);
        this.suppressGetSessionWarning = true;
        const sessionToProcess = Object.assign({}, session);
        const userIsProxy = sessionToProcess.user && sessionToProcess.user.__isUserNotAvailableProxy === true;
        if (this.userStorage) {
          if (!userIsProxy && sessionToProcess.user) {
            await (0, helpers_1.setItemAsync)(this.userStorage, this.storageKey + "-user", {
              user: sessionToProcess.user
            });
          } else if (userIsProxy) {
          }
          const mainSessionData = Object.assign({}, sessionToProcess);
          delete mainSessionData.user;
          const clonedMainSessionData = (0, helpers_1.deepClone)(mainSessionData);
          await (0, helpers_1.setItemAsync)(this.storage, this.storageKey, clonedMainSessionData);
        } else {
          const clonedSession = (0, helpers_1.deepClone)(sessionToProcess);
          await (0, helpers_1.setItemAsync)(this.storage, this.storageKey, clonedSession);
        }
      }
      async _removeSession() {
        this._sessionRemovalEpoch += 1;
        this._debug("#_removeSession()");
        this.lastRefreshFailure = null;
        this.suppressGetSessionWarning = false;
        await (0, helpers_1.removeItemAsync)(this.storage, this.storageKey);
        await (0, helpers_1.removeAllPKCEVerifiers)(this.storage, this.storageKey);
        await (0, helpers_1.removeItemAsync)(this.storage, this.storageKey + "-user");
        if (this.userStorage) {
          await (0, helpers_1.removeItemAsync)(this.userStorage, this.storageKey + "-user");
        }
        await this._notifyAllSubscribers("SIGNED_OUT", null);
      }
      /**
       * Removes any registered visibilitychange callback.
       *
       * {@link GoTrueClient.startAutoRefresh}
       * {@link GoTrueClient.stopAutoRefresh}
       */
      _removeVisibilityChangedCallback() {
        this._debug("#_removeVisibilityChangedCallback()");
        const callback = this.visibilityChangedCallback;
        this.visibilityChangedCallback = null;
        try {
          if (callback && (0, helpers_1.isBrowser)() && (window === null || window === void 0 ? void 0 : window.removeEventListener)) {
            window.removeEventListener("visibilitychange", callback);
          }
        } catch (e) {
          console.error("removing visibilitychange callback failed", e);
        }
      }
      /**
       * This is the private implementation of {@link GoTrueClient.startAutoRefresh}. Use this
       * within the library.
       */
      async _startAutoRefresh() {
        await this._stopAutoRefresh();
        this._debug("#_startAutoRefresh()");
        const ticker = setInterval(() => this._autoRefreshTokenTick(), constants_1.AUTO_REFRESH_TICK_DURATION_MS);
        this.autoRefreshTicker = ticker;
        if (ticker && typeof ticker === "object" && typeof ticker.unref === "function") {
          ticker.unref();
        } else if (typeof Deno !== "undefined" && typeof Deno.unrefTimer === "function") {
          Deno.unrefTimer(ticker);
        }
        const timeout = setTimeout(async () => {
          await this.initializePromise;
          await this._autoRefreshTokenTick();
        }, 0);
        this.autoRefreshTickTimeout = timeout;
        if (timeout && typeof timeout === "object" && typeof timeout.unref === "function") {
          timeout.unref();
        } else if (typeof Deno !== "undefined" && typeof Deno.unrefTimer === "function") {
          Deno.unrefTimer(timeout);
        }
      }
      /**
       * This is the private implementation of {@link GoTrueClient.stopAutoRefresh}. Use this
       * within the library.
       */
      async _stopAutoRefresh() {
        this._debug("#_stopAutoRefresh()");
        const ticker = this.autoRefreshTicker;
        this.autoRefreshTicker = null;
        if (ticker) {
          clearInterval(ticker);
        }
        const timeout = this.autoRefreshTickTimeout;
        this.autoRefreshTickTimeout = null;
        if (timeout) {
          clearTimeout(timeout);
        }
      }
      /**
       * Starts an auto-refresh process in the background. The session is checked
       * every few seconds. Close to the time of expiration a process is started to
       * refresh the session. If refreshing fails it will be retried for as long as
       * necessary.
       *
       * If you set the {@link GoTrueClientOptions#autoRefreshToken} you don't need
       * to call this function, it will be called for you.
       *
       * On browsers the refresh process works only when the tab/window is in the
       * foreground to conserve resources as well as prevent race conditions and
       * flooding auth with requests. If you call this method any managed
       * visibility change callback will be removed and you must manage visibility
       * changes on your own.
       *
       * On non-browser platforms the refresh process works *continuously* in the
       * background, which may not be desirable. You should hook into your
       * platform's foreground indication mechanism and call these methods
       * appropriately to conserve resources.
       *
       * {@link GoTrueClient.stopAutoRefresh}
       *
       * @category Auth
       *
       * @remarks
       * - Only useful in non-browser environments such as React Native or Electron.
       * - The Supabase Auth library automatically starts and stops proactively refreshing the session when a tab is focused or not.
       * - On non-browser platforms, such as mobile or desktop apps built with web technologies, the library is not able to effectively determine whether the application is _focused_ or not.
       * - To give this hint to the application, you should be calling this method when the app is in focus and calling `supabase.auth.stopAutoRefresh()` when it's out of focus.
       *
       * @example Start and stop auto refresh in React Native
       * ```js
       * import { AppState } from 'react-native'
       *
       * // make sure you register this only once!
       * AppState.addEventListener('change', (state) => {
       *   if (state === 'active') {
       *     supabase.auth.startAutoRefresh()
       *   } else {
       *     supabase.auth.stopAutoRefresh()
       *   }
       * })
       * ```
       */
      async startAutoRefresh() {
        this._removeVisibilityChangedCallback();
        await this._startAutoRefresh();
      }
      /**
       * Stops an active auto refresh process running in the background (if any).
       *
       * If you call this method any managed visibility change callback will be
       * removed and you must manage visibility changes on your own.
       *
       * See {@link GoTrueClient.startAutoRefresh} for more details.
       *
       * @category Auth
       *
       * @remarks
       * - Only useful in non-browser environments such as React Native or Electron.
       * - The Supabase Auth library automatically starts and stops proactively refreshing the session when a tab is focused or not.
       * - On non-browser platforms, such as mobile or desktop apps built with web technologies, the library is not able to effectively determine whether the application is _focused_ or not.
       * - When your application goes in the background or out of focus, call this method to stop the proactive refreshing of the session.
       *
       * @example Start and stop auto refresh in React Native
       * ```js
       * import { AppState } from 'react-native'
       *
       * // make sure you register this only once!
       * AppState.addEventListener('change', (state) => {
       *   if (state === 'active') {
       *     supabase.auth.startAutoRefresh()
       *   } else {
       *     supabase.auth.stopAutoRefresh()
       *   }
       * })
       * ```
       */
      async stopAutoRefresh() {
        this._removeVisibilityChangedCallback();
        await this._stopAutoRefresh();
      }
      /**
       * Tears down the client's background work: stops the auto-refresh interval,
       * removes the `visibilitychange` listener, closes the cross-tab
       * `BroadcastChannel`, and clears registered `onAuthStateChange` subscribers.
       *
       * Call this from cleanup hooks when the client is being replaced before
       * its JS realm is destroyed. React Strict Mode and HMR are the common
       * cases. Any in-flight `fetch` calls continue to completion and may still
       * write to storage; dispose doesn't abort them or erase storage.
       *
       * Lifecycle caveat: because in-flight refreshes are not aborted, a
       * disposed instance can still persist a rotated session to storage after
       * `dispose()` returns. A subsequent `createClient` against the same
       * `storageKey` will pick up that session on its next read. If you need
       * strict isolation between client lifecycles, await any pending auth
       * operation before calling `dispose()` (or change the `storageKey` for
       * the replacement client).
       *
       * Safe to call repeatedly.
       *
       * @category Auth
       *
       * @example Cleanup on React unmount
       * ```ts
       * useEffect(() => {
       *   const client = createClient(...)
       *   return () => { client.auth.dispose() }
       * }, [])
       * ```
       */
      async dispose() {
        var _a;
        this._removeVisibilityChangedCallback();
        await this._stopAutoRefresh();
        (_a = this.broadcastChannel) === null || _a === void 0 ? void 0 : _a.close();
        this.broadcastChannel = null;
        this.stateChangeEmitters.clear();
      }
      /**
       * Runs the auto refresh token tick.
       */
      async _autoRefreshTokenTick() {
        this._debug("#_autoRefreshTokenTick()", "begin");
        if (this.lock != null) {
          try {
            await this._acquireLock(0, async () => {
              try {
                const now = Date.now();
                try {
                  return await this._useSession(async (result) => {
                    const { data: { session } } = result;
                    if (!session || !session.refresh_token || !session.expires_at) {
                      this._debug("#_autoRefreshTokenTick()", "no session");
                      return;
                    }
                    const expiresInTicks = Math.floor((session.expires_at * 1e3 - now) / constants_1.AUTO_REFRESH_TICK_DURATION_MS);
                    this._debug("#_autoRefreshTokenTick()", `access token expires in ${expiresInTicks} ticks, a tick lasts ${constants_1.AUTO_REFRESH_TICK_DURATION_MS}ms, refresh threshold is ${constants_1.AUTO_REFRESH_TICK_THRESHOLD} ticks`);
                    if (expiresInTicks <= constants_1.AUTO_REFRESH_TICK_THRESHOLD) {
                      await this._callRefreshToken(session.refresh_token);
                    }
                  });
                } catch (e) {
                  console.error("Auto refresh tick failed with error. This is likely a transient error.", e);
                }
              } finally {
                this._debug("#_autoRefreshTokenTick()", "end");
              }
            });
          } catch (e) {
            if (e instanceof locks_1.LockAcquireTimeoutError) {
              this._debug("auto refresh token tick lock not available");
            } else {
              throw e;
            }
          }
          return;
        }
        if (this.refreshingDeferred !== null) {
          this._debug("#_autoRefreshTokenTick()", "refresh already in flight, skipping");
          return;
        }
        try {
          const now = Date.now();
          try {
            await this._useSession(async (result) => {
              const { data: { session } } = result;
              if (!session || !session.refresh_token || !session.expires_at) {
                this._debug("#_autoRefreshTokenTick()", "no session");
                return;
              }
              const expiresInTicks = Math.floor((session.expires_at * 1e3 - now) / constants_1.AUTO_REFRESH_TICK_DURATION_MS);
              this._debug("#_autoRefreshTokenTick()", `access token expires in ${expiresInTicks} ticks, a tick lasts ${constants_1.AUTO_REFRESH_TICK_DURATION_MS}ms, refresh threshold is ${constants_1.AUTO_REFRESH_TICK_THRESHOLD} ticks`);
              if (expiresInTicks <= constants_1.AUTO_REFRESH_TICK_THRESHOLD) {
                await this._callRefreshToken(session.refresh_token);
              }
            });
          } catch (e) {
            console.error("Auto refresh tick failed with error. This is likely a transient error.", e);
          }
        } finally {
          this._debug("#_autoRefreshTokenTick()", "end");
        }
      }
      /**
       * Registers callbacks on the browser / platform, which in-turn run
       * algorithms when the browser window/tab are in foreground. On non-browser
       * platforms it assumes always foreground.
       */
      async _handleVisibilityChange() {
        this._debug("#_handleVisibilityChange()");
        if (!(0, helpers_1.isBrowser)() || !(window === null || window === void 0 ? void 0 : window.addEventListener)) {
          if (this.autoRefreshToken) {
            this.startAutoRefresh();
          }
          return false;
        }
        try {
          this.visibilityChangedCallback = async () => {
            try {
              await this._onVisibilityChanged(false);
            } catch (error) {
              this._debug("#visibilityChangedCallback", "error", error);
            }
          };
          window === null || window === void 0 ? void 0 : window.addEventListener("visibilitychange", this.visibilityChangedCallback);
          await this._onVisibilityChanged(true);
        } catch (error) {
          console.error("_handleVisibilityChange", error);
        }
      }
      /**
       * Callback registered with `window.addEventListener('visibilitychange')`.
       */
      async _onVisibilityChanged(calledFromInitialize) {
        const methodName = `#_onVisibilityChanged(${calledFromInitialize})`;
        this._debug(methodName, "visibilityState", document.visibilityState);
        if (document.visibilityState === "visible") {
          if (this.autoRefreshToken) {
            this._startAutoRefresh();
          }
          if (!calledFromInitialize) {
            await this.initializePromise;
            if (this.lock != null) {
              await this._acquireLock(this.lockAcquireTimeout, async () => {
                if (document.visibilityState !== "visible") {
                  this._debug(methodName, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");
                  return;
                }
                await this._recoverAndRefresh();
              });
            } else {
              if (document.visibilityState !== "visible") {
                this._debug(methodName, "visibilityState is no longer visible, skipping recovery");
                return;
              }
              await this._recoverAndRefresh();
            }
          }
        } else if (document.visibilityState === "hidden") {
          if (this.autoRefreshToken) {
            this._stopAutoRefresh();
          }
        }
      }
      /**
       * Generates the relevant login URL for a third-party provider.
       * @param options.redirectTo A URL or mobile address to send the user to after they are confirmed.
       * @param options.scopes A space-separated list of scopes granted to the OAuth application.
       * @param options.queryParams An object of key-value pairs containing query parameters granted to the OAuth application.
       */
      async _getUrlForProvider(url, provider, options) {
        let redirectTo = options === null || options === void 0 ? void 0 : options.redirectTo;
        let codeChallenge = null;
        let codeChallengeMethod = null;
        let flowId = null;
        if (this.flowType === "pkce") {
          ;
          [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod();
          redirectTo = this._maybeAppendFlowIdToRedirect(redirectTo, flowId);
        }
        const urlParams = [`provider=${encodeURIComponent(provider)}`];
        if (redirectTo) {
          urlParams.push(`redirect_to=${encodeURIComponent(redirectTo)}`);
        }
        if (options === null || options === void 0 ? void 0 : options.scopes) {
          urlParams.push(`scopes=${encodeURIComponent(options.scopes)}`);
        }
        if (codeChallenge != null && codeChallengeMethod != null) {
          const flowParams = new URLSearchParams({
            code_challenge: `${encodeURIComponent(codeChallenge)}`,
            code_challenge_method: `${encodeURIComponent(codeChallengeMethod)}`
          });
          urlParams.push(flowParams.toString());
        }
        if (options === null || options === void 0 ? void 0 : options.queryParams) {
          const query = new URLSearchParams(options.queryParams);
          urlParams.push(query.toString());
        }
        if (options === null || options === void 0 ? void 0 : options.skipBrowserRedirect) {
          urlParams.push(`skip_http_redirect=${options.skipBrowserRedirect}`);
        }
        return { url: `${url}?${urlParams.join("&")}`, flowId };
      }
      /**
       * Appends the reserved flow id parameter to a redirect URL so the callback
       * can be matched to the verifier stored for its flow. Opt-in via
       * `experimental.appendPkceFlowIdToRedirects`: redirect URLs are validated
       * against the project's allow list including the query string, so an extra
       * parameter can stop exact (non-wildcard) entries from matching.
       */
      _maybeAppendFlowIdToRedirect(redirectTo, flowId) {
        if (!redirectTo || !flowId || !this.experimental.appendPkceFlowIdToRedirects) {
          return redirectTo !== null && redirectTo !== void 0 ? redirectTo : void 0;
        }
        return (0, helpers_1.appendFlowIdToRedirectTo)(redirectTo, flowId);
      }
      /**
       * Generates and stores a PKCE challenge/verifier pair for a new flow,
       * logging any pending verifier the bounded slot ring evicts.
       */
      async _getCodeChallengeAndMethod(isPasswordRecovery = false) {
        return (0, helpers_1.getCodeChallengeAndMethod)(this.storage, this.storageKey, isPasswordRecovery, (evictedFlowId) => this._debug("#_getCodeChallengeAndMethod()", "evicted oldest pending PKCE verifier slot", evictedFlowId));
      }
      async _unenroll(params) {
        try {
          return await this._useSession(async (result) => {
            var _a;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            return await (0, fetch_1._request)(this.fetch, "DELETE", `${this.url}/factors/${params.factorId}`, {
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      async _enroll(params) {
        try {
          return await this._useSession(async (result) => {
            var _a, _b;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            const body = Object.assign({ friendly_name: params.friendlyName, factor_type: params.factorType }, params.factorType === "phone" ? { phone: params.phone } : params.factorType === "totp" ? { issuer: params.issuer } : {});
            const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/factors`, {
              body,
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            if (params.factorType === "totp" && data.type === "totp" && ((_b = data === null || data === void 0 ? void 0 : data.totp) === null || _b === void 0 ? void 0 : _b.qr_code)) {
              data.totp.qr_code = `data:image/svg+xml;utf-8,${data.totp.qr_code}`;
            }
            return this._returnResult({ data, error: null });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      async _verify(params) {
        const run = async () => {
          try {
            return await this._useSession(async (result) => {
              var _a;
              const { data: sessionData, error: sessionError } = result;
              if (sessionError) {
                return this._returnResult({ data: null, error: sessionError });
              }
              const body = Object.assign({ challenge_id: params.challengeId }, "webauthn" in params ? {
                webauthn: Object.assign(Object.assign({}, params.webauthn), { credential_response: params.webauthn.type === "create" ? (0, webauthn_1.serializeCredentialCreationResponse)(params.webauthn.credential_response) : (0, webauthn_1.serializeCredentialRequestResponse)(params.webauthn.credential_response) })
              } : { code: params.code });
              const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/factors/${params.factorId}/verify`, {
                body,
                headers: this.headers,
                jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
              });
              if (error) {
                return this._returnResult({ data: null, error });
              }
              await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + data.expires_in }, data));
              await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", data);
              return this._returnResult({ data, error });
            });
          } catch (error) {
            if ((0, errors_1.isAuthError)(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        };
        if (this.lock != null) {
          return this._acquireLock(this.lockAcquireTimeout, run);
        }
        return run();
      }
      async _challenge(params) {
        const run = async () => {
          try {
            return await this._useSession(async (result) => {
              var _a;
              const { data: sessionData, error: sessionError } = result;
              if (sessionError) {
                return this._returnResult({ data: null, error: sessionError });
              }
              const response = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/factors/${params.factorId}/challenge`, {
                body: params,
                headers: this.headers,
                jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
              });
              if (response.error) {
                return response;
              }
              const { data } = response;
              if (data.type !== "webauthn") {
                return { data, error: null };
              }
              switch (data.webauthn.type) {
                case "create":
                  return {
                    data: Object.assign(Object.assign({}, data), { webauthn: Object.assign(Object.assign({}, data.webauthn), { credential_options: Object.assign(Object.assign({}, data.webauthn.credential_options), { publicKey: (0, webauthn_1.deserializeCredentialCreationOptions)(data.webauthn.credential_options.publicKey) }) }) }),
                    error: null
                  };
                case "request":
                  return {
                    data: Object.assign(Object.assign({}, data), { webauthn: Object.assign(Object.assign({}, data.webauthn), { credential_options: Object.assign(Object.assign({}, data.webauthn.credential_options), { publicKey: (0, webauthn_1.deserializeCredentialRequestOptions)(data.webauthn.credential_options.publicKey) }) }) }),
                    error: null
                  };
              }
            });
          } catch (error) {
            if ((0, errors_1.isAuthError)(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        };
        if (this.lock != null) {
          return this._acquireLock(this.lockAcquireTimeout, run);
        }
        return run();
      }
      /**
       * {@link GoTrueMFAApi#challengeAndVerify}
       */
      async _challengeAndVerify(params) {
        const { data: challengeData, error: challengeError } = await this._challenge({
          factorId: params.factorId
        });
        if (challengeError) {
          return this._returnResult({ data: null, error: challengeError });
        }
        return await this._verify({
          factorId: params.factorId,
          challengeId: challengeData.id,
          code: params.code
        });
      }
      /**
       * {@link GoTrueMFAApi#listFactors}
       */
      async _listFactors() {
        var _a;
        const { data: { user }, error: userError } = await this.getUser();
        if (userError) {
          return { data: null, error: userError };
        }
        const data = {
          all: [],
          phone: [],
          totp: [],
          webauthn: [],
          recovery_code: []
        };
        for (const factor of (_a = user === null || user === void 0 ? void 0 : user.factors) !== null && _a !== void 0 ? _a : []) {
          data.all.push(factor);
          if (factor.status === "verified" && factor.factor_type in data && Array.isArray(data[factor.factor_type])) {
            ;
            data[factor.factor_type].push(factor);
          }
        }
        return {
          data,
          error: null
        };
      }
      /**
       * {@link GoTrueMFAApi#getAuthenticatorAssuranceLevel}
       */
      async _getAuthenticatorAssuranceLevel(jwt) {
        var _a, _b, _c, _d;
        if (jwt) {
          try {
            const { payload: payload2 } = (0, helpers_1.decodeJWT)(jwt);
            let currentLevel2 = null;
            if (payload2.aal) {
              currentLevel2 = payload2.aal;
            }
            let nextLevel2 = currentLevel2;
            const { data: { user }, error: userError } = await this.getUser(jwt);
            if (userError) {
              return this._returnResult({ data: null, error: userError });
            }
            const verifiedFactors2 = (_b = (_a = user === null || user === void 0 ? void 0 : user.factors) === null || _a === void 0 ? void 0 : _a.filter((factor) => factor.status === "verified")) !== null && _b !== void 0 ? _b : [];
            if (verifiedFactors2.length > 0) {
              nextLevel2 = "aal2";
            }
            const currentAuthenticationMethods2 = payload2.amr || [];
            return { data: { currentLevel: currentLevel2, nextLevel: nextLevel2, currentAuthenticationMethods: currentAuthenticationMethods2 }, error: null };
          } catch (error) {
            if ((0, errors_1.isAuthError)(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
        const { data: { session }, error: sessionError } = await this.getSession();
        if (sessionError) {
          return this._returnResult({ data: null, error: sessionError });
        }
        if (!session) {
          return {
            data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
            error: null
          };
        }
        const { payload } = (0, helpers_1.decodeJWT)(session.access_token);
        let currentLevel = null;
        if (payload.aal) {
          currentLevel = payload.aal;
        }
        let nextLevel = currentLevel;
        const verifiedFactors = (_d = (_c = session.user.factors) === null || _c === void 0 ? void 0 : _c.filter((factor) => factor.status === "verified")) !== null && _d !== void 0 ? _d : [];
        if (verifiedFactors.length > 0) {
          nextLevel = "aal2";
        }
        const currentAuthenticationMethods = payload.amr || [];
        return { data: { currentLevel, nextLevel, currentAuthenticationMethods }, error: null };
      }
      /**
       * {@link AuthMFARecoveryCodesApi#getStatus}
       */
      async _getRecoveryCodesStatus() {
        (0, helpers_1.assertRecoveryCodesExperimentalEnabled)(this.experimental);
        try {
          return await this._useSession(async (result) => {
            var _a;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            const { data, error } = await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/factors/recovery-codes`, {
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            return this._returnResult({ data, error: null });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * {@link AuthMFARecoveryCodesApi#generate}
       */
      async _generateRecoveryCodes(params) {
        (0, helpers_1.assertRecoveryCodesExperimentalEnabled)(this.experimental);
        try {
          return await this._useSession(async (result) => {
            var _a;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/factors/recovery-codes`, {
              // The body is optional server-side; only send one when a name was given.
              body: (params === null || params === void 0 ? void 0 : params.friendlyName) ? { friendly_name: params.friendlyName } : void 0,
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            return this._returnResult({ data, error: null });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * {@link AuthMFARecoveryCodesApi#verify}
       */
      async _verifyRecoveryCode(params) {
        (0, helpers_1.assertRecoveryCodesExperimentalEnabled)(this.experimental);
        const run = async () => {
          try {
            return await this._useSession(async (result) => {
              var _a;
              const { data: sessionData, error: sessionError } = result;
              if (sessionError) {
                return this._returnResult({ data: null, error: sessionError });
              }
              const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/factors/recovery-codes/verify`, {
                body: { code: params.code },
                headers: this.headers,
                jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
              });
              if (error) {
                return this._returnResult({ data: null, error });
              }
              const session = Object.assign({ expires_at: (0, helpers_1.expiresAt)(data.expires_in) }, data);
              await this._saveSession(session);
              await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", session);
              return this._returnResult({ data, error: null });
            });
          } catch (error) {
            if ((0, errors_1.isAuthError)(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        };
        if (this.lock != null) {
          return this._acquireLock(this.lockAcquireTimeout, run);
        }
        return run();
      }
      /**
       * {@link AuthMFARecoveryCodesApi#regenerate}
       */
      async _regenerateRecoveryCodes() {
        (0, helpers_1.assertRecoveryCodesExperimentalEnabled)(this.experimental);
        try {
          return await this._useSession(async (result) => {
            var _a;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/factors/recovery-codes/regenerate`, {
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            return this._returnResult({ data, error: null });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * {@link AuthMFARecoveryCodesApi#unenroll}
       */
      async _unenrollRecoveryCodes() {
        (0, helpers_1.assertRecoveryCodesExperimentalEnabled)(this.experimental);
        try {
          return await this._useSession(async (result) => {
            var _a;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            const { data, error } = await (0, fetch_1._request)(this.fetch, "DELETE", `${this.url}/factors/recovery-codes`, {
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            return this._returnResult({ data, error: null });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Retrieves details about an OAuth authorization request.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       *
       * Returns authorization details including client info, scopes, and user information.
       * If the response includes only a redirect_url field, it means consent was already given - the caller
       * should handle the redirect manually if needed.
       */
      async _getAuthorizationDetails(authorizationId) {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new errors_1.AuthSessionMissingError() });
            }
            return await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/oauth/authorizations/${authorizationId}`, {
              headers: this.headers,
              jwt: session.access_token,
              xform: (data) => ({ data, error: null })
            });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Approves an OAuth authorization request.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       */
      async _approveAuthorization(authorizationId, options) {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new errors_1.AuthSessionMissingError() });
            }
            const response = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/oauth/authorizations/${authorizationId}/consent`, {
              headers: this.headers,
              jwt: session.access_token,
              body: { action: "approve" },
              xform: (data) => ({ data, error: null })
            });
            if (response.data && response.data.redirect_url) {
              if ((0, helpers_1.isBrowser)() && !(options === null || options === void 0 ? void 0 : options.skipBrowserRedirect)) {
                window.location.assign(response.data.redirect_url);
              }
            }
            return response;
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Denies an OAuth authorization request.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       */
      async _denyAuthorization(authorizationId, options) {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new errors_1.AuthSessionMissingError() });
            }
            const response = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/oauth/authorizations/${authorizationId}/consent`, {
              headers: this.headers,
              jwt: session.access_token,
              body: { action: "deny" },
              xform: (data) => ({ data, error: null })
            });
            if (response.data && response.data.redirect_url) {
              if ((0, helpers_1.isBrowser)() && !(options === null || options === void 0 ? void 0 : options.skipBrowserRedirect)) {
                window.location.assign(response.data.redirect_url);
              }
            }
            return response;
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Lists all OAuth grants that the authenticated user has authorized.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       */
      async _listOAuthGrants() {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new errors_1.AuthSessionMissingError() });
            }
            return await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/user/oauth/grants`, {
              headers: this.headers,
              jwt: session.access_token,
              xform: (data) => ({ data, error: null })
            });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Revokes a user's OAuth grant for a specific client.
       * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
       */
      async _revokeOAuthGrant(options) {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new errors_1.AuthSessionMissingError() });
            }
            await (0, fetch_1._request)(this.fetch, "DELETE", `${this.url}/user/oauth/grants`, {
              headers: this.headers,
              jwt: session.access_token,
              query: { client_id: options.clientId },
              noResolveJson: true
            });
            return { data: {}, error: null };
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      async fetchJwk(kid, jwks = { keys: [] }) {
        let jwk = jwks.keys.find((key) => key.kid === kid);
        if (jwk) {
          return jwk;
        }
        const now = Date.now();
        jwk = this.jwks.keys.find((key) => key.kid === kid);
        if (jwk && this.jwks_cached_at + constants_1.JWKS_TTL > now) {
          return jwk;
        }
        const { data, error } = await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
          headers: this.headers
        });
        if (error) {
          throw error;
        }
        if (!data.keys || data.keys.length === 0) {
          return null;
        }
        this.jwks = data;
        this.jwks_cached_at = now;
        jwk = data.keys.find((key) => key.kid === kid);
        if (!jwk) {
          return null;
        }
        return jwk;
      }
      /**
       * Extracts the JWT claims present in the access token by first verifying the
       * JWT against the server's JSON Web Key Set endpoint
       * `/.well-known/jwks.json` which is often cached, resulting in significantly
       * faster responses. Prefer this method over {@link GoTrueClient.getUser} which always
       * sends a request to the Auth server for each JWT.
       *
       * If the project is not using an asymmetric JWT signing key (like ECC or
       * RSA) it always sends a request to the Auth server (similar to
       * {@link GoTrueClient.getUser}) to verify the JWT.
       *
       * @param jwt An optional specific JWT you wish to verify, not the one you
       *            can obtain from {@link GoTrueClient.getSession}.
       * @param options Various additional options that allow you to customize the
       *                behavior of this method.
       *
       * @category Auth
       *
       * @remarks
       * - Parses the user's [access token](/docs/guides/auth/sessions#access-token-jwt-claims) as a [JSON Web Token (JWT)](/docs/guides/auth/jwts) and returns its components if valid and not expired.
       * - If your project is using asymmetric JWT signing keys, then the verification is done locally usually without a network request using the [WebCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).
       * - A network request is sent to your project's JWT signing key discovery endpoint `https://project-id.supabase.co/auth/v1/.well-known/jwks.json`, which is cached locally. If your environment is ephemeral, such as a Lambda function that is destroyed after every request, a network request will be sent for each new invocation. Supabase provides a network-edge cache providing fast responses for these situations.
       * - If the user's access token is about to expire when calling this function, the user's session will first be refreshed before validating the JWT.
       * - If your project is using a symmetric secret to sign the JWT, it always sends a request similar to `getUser()` to validate the JWT at the server before returning the decoded token. This is also used if the WebCrypto API is not available in the environment. Make sure you polyfill it in such situations.
       * - The returned claims can be customized per project using the [Custom Access Token Hook](/docs/guides/auth/auth-hooks/custom-access-token-hook).
       *
       * @example Get JWT claims, header and signature
       * ```js
       * const { data, error } = await supabase.auth.getClaims()
       * ```
       *
       * @exampleResponse Get JWT claims, header and signature
       * ```json
       * {
       *   "data": {
       *     "claims": {
       *       "aal": "aal1",
       *       "amr": [{
       *         "method": "email",
       *         "timestamp": 1715766000
       *       }],
       *       "app_metadata": {},
       *       "aud": "authenticated",
       *       "email": "example@email.com",
       *       "exp": 1715769600,
       *       "iat": 1715766000,
       *       "is_anonymous": false,
       *       "iss": "https://project-id.supabase.co/auth/v1",
       *       "phone": "+13334445555",
       *       "role": "authenticated",
       *       "session_id": "11111111-1111-1111-1111-111111111111",
       *       "sub": "11111111-1111-1111-1111-111111111111",
       *       "user_metadata": {}
       *     },
       *     "header": {
       *       "alg": "RS256",
       *       "typ": "JWT",
       *       "kid": "11111111-1111-1111-1111-111111111111"
       *     },
       *     "signature": [/** Uint8Array *\/],
       *   },
       *   "error": null
       * }
       * ```
       */
      async getClaims(jwt, options = {}) {
        try {
          let token = jwt;
          if (!token) {
            const { data, error } = await this.getSession();
            if (error || !data.session) {
              return this._returnResult({ data: null, error });
            }
            token = data.session.access_token;
          }
          const { header, payload, signature, raw: { header: rawHeader, payload: rawPayload } } = (0, helpers_1.decodeJWT)(token);
          if (!(options === null || options === void 0 ? void 0 : options.allowExpired)) {
            try {
              (0, helpers_1.validateExp)(payload.exp);
            } catch (e) {
              throw new errors_1.AuthInvalidJwtError(e instanceof Error ? e.message : "JWT validation failed");
            }
          }
          const signingKey = !header.alg || header.alg.startsWith("HS") || !header.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(header.kid, (options === null || options === void 0 ? void 0 : options.keys) ? { keys: options.keys } : options === null || options === void 0 ? void 0 : options.jwks);
          if (!signingKey) {
            const { error } = await this.getUser(token);
            if (error) {
              throw error;
            }
            return {
              data: {
                claims: payload,
                header,
                signature
              },
              error: null
            };
          }
          const algorithm = (0, helpers_1.getAlgorithm)(header.alg);
          const publicKey = await crypto.subtle.importKey("jwk", signingKey, algorithm, true, [
            "verify"
          ]);
          const isValid = await crypto.subtle.verify(algorithm, publicKey, signature, (0, base64url_1.stringToUint8Array)(`${rawHeader}.${rawPayload}`));
          if (!isValid) {
            throw new errors_1.AuthInvalidJwtError("Invalid JWT signature");
          }
          return {
            data: {
              claims: payload,
              header,
              signature
            },
            error: null
          };
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      // --- Passkey Methods ---
      /**
       * Sign in with a passkey. Handles the full WebAuthn ceremony:
       * 1. Fetches authentication challenge from server
       * 2. Prompts user via navigator.credentials.get()
       * 3. Verifies credential with server and creates session
       *
       * Pass `options.mediation: 'conditional'` to use WebAuthn Conditional UI
       * (passkey autofill) instead of the modal picker; the value is forwarded to
       * `navigator.credentials.get()` unchanged.
       *
       * The challenge fetched in step 1 expires after the server's
       * GOTRUE_WEBAUTHN_CHALLENGE_EXPIRY_DURATION (5 minutes by default). With
       * `mediation: 'conditional'` the autofill prompt can stay pending for longer
       * than that: the browser ceremony then still succeeds, but verification fails
       * with `error_code: "webauthn_challenge_expired"`. Recover by calling
       * `signInWithPasskey()` again. It fetches a fresh challenge and, unless you
       * passed your own `options.signal`, cancels the pending ceremony first, so
       * the browser never sees two concurrent WebAuthn requests; the earlier call
       * resolves with a `WebAuthnError` whose code is `ERROR_CEREMONY_ABORTED`. If
       * you pass your own `signal`, abort it before retrying.
       *
       * @category Auth
       *
       * @example Sign in with Conditional UI (passkey autofill)
       * ```js
       * // <input autocomplete="username webauthn" /> somewhere on the page
       * const { data, error } = await supabase.auth.signInWithPasskey({
       *   options: {
       *     mediation: 'conditional'
       *   }
       * });
       * ```
       */
      async signInWithPasskey(credentials) {
        var _a, _b, _c, _d;
        try {
          if (!(0, webauthn_1.browserSupportsWebAuthn)()) {
            return this._returnResult({
              data: null,
              error: new errors_1.AuthUnknownError("Browser does not support WebAuthn", null)
            });
          }
          const { data: options, error: optionsError } = await this._startPasskeyAuthentication({
            options: { captchaToken: (_a = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _a === void 0 ? void 0 : _a.captchaToken }
          });
          if (optionsError || !options) {
            return this._returnResult({ data: null, error: optionsError });
          }
          const publicKeyOptions = (0, webauthn_1.deserializeCredentialRequestOptions)(options.options);
          const signal = (_c = (_b = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _b === void 0 ? void 0 : _b.signal) !== null && _c !== void 0 ? _c : webauthn_1.webAuthnAbortService.createNewAbortSignal();
          const { data: credential, error: credentialError } = await (0, webauthn_1.getCredential)({
            publicKey: publicKeyOptions,
            signal,
            mediation: (_d = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _d === void 0 ? void 0 : _d.mediation
          });
          if (credentialError || !credential) {
            return this._returnResult({
              data: null,
              error: credentialError !== null && credentialError !== void 0 ? credentialError : new errors_1.AuthUnknownError("WebAuthn ceremony failed", null)
            });
          }
          const serialized = (0, webauthn_1.serializeCredentialRequestResponse)(credential);
          return this._verifyPasskeyAuthentication({
            challengeId: options.challenge_id,
            credential: serialized
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Register a passkey for the current authenticated user. Handles the full WebAuthn ceremony:
       * 1. Fetches registration challenge from server
       * 2. Prompts user via navigator.credentials.create()
       * 3. Verifies credential with server
       *
       * Requires an active session.
       *
       * @category Auth
       */
      async registerPasskey(credentials) {
        var _a, _b;
        try {
          if (!(0, webauthn_1.browserSupportsWebAuthn)()) {
            return this._returnResult({
              data: null,
              error: new errors_1.AuthUnknownError("Browser does not support WebAuthn", null)
            });
          }
          const { data: options, error: optionsError } = await this._startPasskeyRegistration();
          if (optionsError || !options) {
            return this._returnResult({ data: null, error: optionsError });
          }
          const publicKeyOptions = (0, webauthn_1.deserializeCredentialCreationOptions)(options.options);
          const signal = (_b = (_a = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _a === void 0 ? void 0 : _a.signal) !== null && _b !== void 0 ? _b : webauthn_1.webAuthnAbortService.createNewAbortSignal();
          const { data: credential, error: credentialError } = await (0, webauthn_1.createCredential)({
            publicKey: publicKeyOptions,
            signal
          });
          if (credentialError || !credential) {
            return this._returnResult({
              data: null,
              error: credentialError !== null && credentialError !== void 0 ? credentialError : new errors_1.AuthUnknownError("WebAuthn ceremony failed", null)
            });
          }
          const serialized = (0, webauthn_1.serializeCredentialCreationResponse)(credential);
          return this._verifyPasskeyRegistration({
            challengeId: options.challenge_id,
            credential: serialized
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Start passkey registration for the current authenticated user.
       * Returns WebAuthn credential creation options to pass to navigator.credentials.create().
       */
      async _startPasskeyRegistration() {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new errors_1.AuthSessionMissingError() });
            }
            const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/passkeys/registration/options`, {
              headers: this.headers,
              jwt: session.access_token,
              body: {}
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            return this._returnResult({ data, error: null });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Verify passkey registration with the credential response.
       * The credentialResponse should be the serialized output of navigator.credentials.create().
       */
      async _verifyPasskeyRegistration(params) {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new errors_1.AuthSessionMissingError() });
            }
            const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/passkeys/registration/verify`, {
              headers: this.headers,
              jwt: session.access_token,
              body: {
                challenge_id: params.challengeId,
                credential: params.credential
              }
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            return this._returnResult({ data, error: null });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Start passkey authentication.
       * Returns WebAuthn credential request options to pass to navigator.credentials.get().
       */
      async _startPasskeyAuthentication(params) {
        var _a;
        try {
          const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/passkeys/authentication/options`, {
            headers: this.headers,
            body: {
              gotrue_meta_security: { captcha_token: (_a = params === null || params === void 0 ? void 0 : params.options) === null || _a === void 0 ? void 0 : _a.captchaToken }
            }
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          return this._returnResult({ data, error: null });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Verify passkey authentication and create a session.
       * The credential should be the serialized output of navigator.credentials.get().
       */
      async _verifyPasskeyAuthentication(params) {
        try {
          const { data, error } = await (0, fetch_1._request)(this.fetch, "POST", `${this.url}/passkeys/authentication/verify`, {
            headers: this.headers,
            body: {
              challenge_id: params.challengeId,
              credential: params.credential
            },
            xform: fetch_1._sessionResponse
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("SIGNED_IN", data.session);
          }
          return this._returnResult({ data, error: null });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * List all passkeys for the current user.
       */
      async _listPasskeys() {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new errors_1.AuthSessionMissingError() });
            }
            const { data, error } = await (0, fetch_1._request)(this.fetch, "GET", `${this.url}/passkeys`, {
              headers: this.headers,
              jwt: session.access_token,
              xform: (data2) => ({ data: data2, error: null })
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            return this._returnResult({ data, error: null });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Update a passkey.
       */
      async _updatePasskey(params) {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new errors_1.AuthSessionMissingError() });
            }
            const { data, error } = await (0, fetch_1._request)(this.fetch, "PATCH", `${this.url}/passkeys/${params.passkeyId}`, {
              headers: this.headers,
              jwt: session.access_token,
              body: { friendly_name: params.friendlyName }
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            return this._returnResult({ data, error: null });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      /**
       * Delete a passkey.
       */
      async _deletePasskey(params) {
        try {
          return await this._useSession(async (result) => {
            const { data: { session }, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            if (!session) {
              return this._returnResult({ data: null, error: new errors_1.AuthSessionMissingError() });
            }
            const { error } = await (0, fetch_1._request)(this.fetch, "DELETE", `${this.url}/passkeys/${params.passkeyId}`, {
              headers: this.headers,
              jwt: session.access_token,
              noResolveJson: true
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            return this._returnResult({ data: null, error: null });
          });
        } catch (error) {
          if ((0, errors_1.isAuthError)(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
    };
    GoTrueClient.nextInstanceID = {};
    exports.default = GoTrueClient;
  }
});

// node_modules/@supabase/auth-js/dist/main/AuthAdminApi.js
var require_AuthAdminApi = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/AuthAdminApi.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var GoTrueAdminApi_1 = tslib_1.__importDefault(require_GoTrueAdminApi());
    var AuthAdminApi = GoTrueAdminApi_1.default;
    exports.default = AuthAdminApi;
  }
});

// node_modules/@supabase/auth-js/dist/main/AuthClient.js
var require_AuthClient = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/AuthClient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var GoTrueClient_1 = tslib_1.__importDefault(require_GoTrueClient());
    var AuthClient3 = GoTrueClient_1.default;
    exports.default = AuthClient3;
  }
});

// node_modules/@supabase/auth-js/dist/main/index.js
var require_main = __commonJS({
  "node_modules/@supabase/auth-js/dist/main/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.processLock = exports.lockInternals = exports.NavigatorLockAcquireTimeoutError = exports.navigatorLock = exports.AuthClient = exports.AuthAdminApi = exports.GoTrueClient = exports.GoTrueAdminApi = void 0;
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var GoTrueAdminApi_1 = tslib_1.__importDefault(require_GoTrueAdminApi());
    exports.GoTrueAdminApi = GoTrueAdminApi_1.default;
    var GoTrueClient_1 = tslib_1.__importDefault(require_GoTrueClient());
    exports.GoTrueClient = GoTrueClient_1.default;
    var AuthAdminApi_1 = tslib_1.__importDefault(require_AuthAdminApi());
    exports.AuthAdminApi = AuthAdminApi_1.default;
    var AuthClient_1 = tslib_1.__importDefault(require_AuthClient());
    exports.AuthClient = AuthClient_1.default;
    tslib_1.__exportStar(require_types(), exports);
    tslib_1.__exportStar(require_errors(), exports);
    var locks_1 = require_locks();
    Object.defineProperty(exports, "navigatorLock", { enumerable: true, get: function() {
      return locks_1.navigatorLock;
    } });
    Object.defineProperty(exports, "NavigatorLockAcquireTimeoutError", { enumerable: true, get: function() {
      return locks_1.NavigatorLockAcquireTimeoutError;
    } });
    Object.defineProperty(exports, "lockInternals", { enumerable: true, get: function() {
      return locks_1.internals;
    } });
    Object.defineProperty(exports, "processLock", { enumerable: true, get: function() {
      return locks_1.processLock;
    } });
  }
});

// server/http.mjs
var HttpError = class extends Error {
  constructor(status2, message) {
    super(message);
    this.status = status2;
  }
};
var json = (data, status2 = 200, extra = {}) => new Response(JSON.stringify(data), { status: status2, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...extra } });
var fail = (status2, message) => {
  throw new HttpError(status2, message);
};
var sql = (db, query, ...args) => db.prepare(query).bind(...args);
function protectMutation(request, origin = new URL(request.url).origin) {
  if (["GET", "HEAD"].includes(request.method)) return;
  if (request.headers.get("origin") !== origin || request.headers.get("x-learning-hub") !== "1") fail(403, "Permintaan tidak diizinkan. Muat ulang halaman.");
  if (!request.headers.get("content-type")?.startsWith("application/json")) fail(415, "Gunakan Content-Type application/json.");
}
async function bodyJSON(request, limit = 16384) {
  const tooBig = () => fail(413, "Permintaan terlalu besar.");
  if (Number(request.headers.get("content-length") || 0) > limit) tooBig();
  const reader = request.body?.getReader();
  if (!reader) fail(400, "Body JSON diperlukan.");
  const chunks = [];
  let size2 = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size2 += value.byteLength;
    if (size2 > limit) {
      await reader.cancel();
      tooBig();
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size2);
  let offset = 0;
  for (const part of chunks) {
    bytes.set(part, offset);
    offset += part.length;
  }
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) fail(400, "Body harus berupa objek JSON.");
    return parsed;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    fail(400, "JSON tidak valid.");
  }
}

// server/rich.mjs
var import_sanitize_html = __toESM(require_sanitize_html(), 1);
var FONTS = ["DM Sans", "Manrope", "Georgia", "Courier New"];
var FONT_SIZES = ["13px", "18px", "22px"];
var FONT_RE = new RegExp(`^['"]?(${FONTS.join("|")})['"]?(\\s*,\\s*['"]?[a-zA-Z -]{1,30}['"]?){0,3}$`);
var COLOR_RE = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/i;
var PX_RE = /^\d{1,4}px$/;
var esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var plainToHtml = (text) => String(text || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
var hasRichContent = (html) => /<(img|table|hr|iframe)\b/i.test(html) || html.replace(/<[^>]+>/g, "").replace(/&nbsp;|\s/g, "").length > 0;
function sanitizeRich(html, { mediaPrefix: mediaPrefix2 }) {
  return (0, import_sanitize_html.default)(String(html || ""), {
    allowedTags: ["p", "br", "strong", "em", "u", "s", "span", "a", "ul", "ol", "li", "blockquote", "hr", "table", "colgroup", "col", "tbody", "thead", "tr", "th", "td", "img", "div", "iframe"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "data-size"],
      p: ["style", "data-indent"],
      span: ["style"],
      li: ["style"],
      th: ["colspan", "rowspan", "style"],
      td: ["colspan", "rowspan", "style"],
      ol: ["start"],
      col: ["style"],
      blockquote: ["style"],
      div: ["data-youtube-video"],
      iframe: ["src", "width", "height", "allowfullscreen", "title", "allow", "referrerpolicy", "loading"]
    },
    allowedStyles: { "*": {
      "text-align": [/^(left|center|right|justify)$/],
      "font-family": [FONT_RE],
      "font-size": [new RegExp(`^(${FONT_SIZES.join("|")})$`)],
      "color": [COLOR_RE],
      "background-color": [COLOR_RE],
      "min-width": [PX_RE],
      "width": [PX_RE]
    } },
    allowedSchemes: ["https", "http", "mailto"],
    allowedSchemesByTag: { img: ["https", "http"], iframe: ["https"] },
    allowedIframeHostnames: ["www.youtube-nocookie.com"],
    allowProtocolRelative: false,
    transformTags: {
      b: "strong",
      i: "em",
      strike: "s",
      del: "s",
      a: (tag, a) => ({ tagName: "a", attribs: { ...a.href ? { href: a.href } : {}, target: "_blank", rel: "noopener noreferrer" } }),
      p: (tag, a) => ({ tagName: "p", attribs: { ...a.style ? { style: a.style } : {}, .../^[1-4]$/.test(a["data-indent"] || "") ? { "data-indent": a["data-indent"] } : {} } }),
      div: (tag, a) => ({ tagName: "div", attribs: "data-youtube-video" in a ? { "data-youtube-video": "" } : {} }),
      // Video YouTube di dalam teks: hanya embed youtube-nocookie dengan ID valid; atribut lain ditetapkan server.
      iframe: (tag, a) => {
        const m = /^https:\/\/www\.youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})(?:\?(?:start=(\d{1,6}))?.*)?$/.exec(a.src || "");
        return m ? { tagName: "iframe", attribs: { src: `https://www.youtube-nocookie.com/embed/${m[1]}${m[2] ? `?start=${m[2]}` : ""}`, width: "640", height: "360", title: "Video YouTube", allowfullscreen: "true", allow: "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen", referrerpolicy: "strict-origin-when-cross-origin", loading: "lazy" } } : { tagName: "iframe", attribs: {} };
      },
      img: (tag, a) => ({ tagName: "img", attribs: { src: a.src || "", alt: (a.alt || "").slice(0, 200), ...["s", "m", "l"].includes(a["data-size"]) ? { "data-size": a["data-size"] } : {} } })
    },
    // Gambar hanya dari bucket media proyek ini (gambar lain dibuang).
    exclusiveFilter: (frame) => frame.tag === "img" && !(frame.attribs.src || "").startsWith(mediaPrefix2) || frame.tag === "iframe" && !frame.attribs.src
  });
}

// server/content.mjs
var COLORS = ["peach", "sage", "lavender", "blue", "sand", "pink"];
var ARTS = ["conversation", "listening", "quality", "journey", "documents", "ownership", "growth"];
var LEVELS = ["Fundamental", "Intermediate", "Advanced"];
var ID_RE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
var MEDIA_BUCKET = "lms-media";
var bad = (message) => {
  throw new HttpError(422, message);
};
var str = (v, max, label) => {
  if (v === void 0 || v === null) return "";
  if (typeof v !== "string") bad(`${label} harus berupa teks.`);
  const s = v.replace(/\r\n?/g, "\n").trim();
  if (s.length > max) bad(`${label} maksimal ${max} karakter.`);
  return s;
};
var int = (v, min, max, label, fallback) => {
  if (v === "" || v === void 0 || v === null) return fallback;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) bad(`${label} harus angka bulat ${min}\u2013${max}.`);
  return n;
};
var pick = (v, list, fallback) => list.includes(v) ? v : fallback;
var arr = (v, max, label) => {
  if (v === void 0 || v === null) return [];
  if (!Array.isArray(v)) bad(`${label} tidak valid.`);
  if (v.length > max) bad(`${label} maksimal ${max} item.`);
  return v;
};
function youtubeId(input) {
  if (!input) return "";
  const s = String(input).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  let url;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (["youtube.com", "youtube-nocookie.com"].includes(host)) {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
      id = m?.[1];
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}
var mediaPrefix = (supabaseUrl) => `${supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/`;
function section(s, i, label, ctx) {
  const where = `${label}, bagian ${i + 1}`;
  if (Array.isArray(s)) s = { heading: s[0], body: s[1] };
  if (!s || typeof s !== "object") bad(`${where} tidak valid.`);
  const raw = typeof s.html === "string" ? s.html : plainToHtml(str(s.body, 1e4, `${where}: isi`));
  if (raw.length > 2e5) bad(`${where}: isi terlalu panjang. Bagi menjadi beberapa bagian.`);
  const out = { heading: str(s.heading, 160, `${where}: judul`), html: sanitizeRich(raw, { mediaPrefix: mediaPrefix(ctx.supabaseUrl) }) };
  const imageUrl = str(s.image?.url ?? s.imageUrl, 600, `${where}: URL gambar`);
  if (imageUrl) {
    if (!imageUrl.startsWith(mediaPrefix(ctx.supabaseUrl)) || /["'<>\s]/.test(imageUrl)) bad(`${where}: gambar harus diunggah lewat tombol Unggah gambar.`);
    out.image = { url: imageUrl, alt: str(s.image?.alt ?? s.imageAlt, 200, `${where}: teks alternatif gambar`), caption: str(s.image?.caption, 200, `${where}: keterangan gambar`) };
  }
  const rawVideo = s.video?.youtubeId ?? s.video?.url ?? s.videoUrl ?? "";
  if (rawVideo) {
    const id = youtubeId(rawVideo);
    if (!id) bad(`${where}: link YouTube tidak dikenali.`);
    out.video = { youtubeId: id, title: str(s.video?.title, 160, `${where}: judul video`) };
  }
  return out;
}
function lessonIdFor(raw, used) {
  let id = typeof raw === "string" && ID_RE.test(raw) ? raw : "";
  while (!id || used.has(id)) id = "m" + Math.random().toString(36).slice(2, 10);
  used.add(id);
  return id;
}
function normalize(kind, d, ctx) {
  if (!d || typeof d !== "object" || Array.isArray(d)) bad("Isi konten tidak valid.");
  const base = {
    title: str(d.title, 140, "Judul"),
    category: str(d.category, 60, "Kategori"),
    description: str(d.description, 500, "Deskripsi"),
    color: pick(d.color, COLORS, "peach")
  };
  if (kind === "course") {
    const used = /* @__PURE__ */ new Set();
    const lessons = arr(d.lessons, 60, "Modul").map((l, i) => {
      if (!l || typeof l !== "object") bad(`Modul ${i + 1} tidak valid.`);
      return {
        id: lessonIdFor(l.id, used),
        title: str(l.title, 160, `Modul ${i + 1}: judul`),
        duration: int(l.duration, 1, 600, `Modul ${i + 1}: durasi`, 5),
        intro: str(l.intro, 2e3, `Modul ${i + 1}: pengantar`),
        sections: arr(l.sections, 40, `Modul ${i + 1}: bagian`).map((s, j) => section(s, j, `Modul ${i + 1}`, ctx))
      };
    });
    return { ...base, level: pick(d.level, LEVELS, "Fundamental"), art: pick(d.art, ARTS, "conversation"), lessons };
  }
  if (kind === "quiz") {
    const questions = arr(d.questions, 60, "Pertanyaan").map((q, i) => {
      if (!q || typeof q !== "object") bad(`Pertanyaan ${i + 1} tidak valid.`);
      if (q.type === "essay") return {
        type: "essay",
        q: str(q.q, 2e3, `Pertanyaan ${i + 1}`),
        points: int(q.points, 1, 100, `Pertanyaan ${i + 1}: poin`, 5),
        rubric: str(q.rubric ?? q.why, 4e3, `Pertanyaan ${i + 1}: rubrik`)
      };
      const options = arr(q.options, 6, `Pertanyaan ${i + 1}: pilihan`).map((o, j) => str(o, 400, `Pertanyaan ${i + 1}: pilihan ${String.fromCharCode(65 + j)}`));
      const answer = q.answer === null || q.answer === void 0 || q.answer === "" ? null : Number(q.answer);
      if (answer !== null && (!Number.isInteger(answer) || answer < 0 || answer >= Math.max(options.length, 1))) bad(`Pertanyaan ${i + 1}: jawaban benar tidak valid.`);
      return { type: "mc", q: str(q.q, 600, `Pertanyaan ${i + 1}`), options, answer, why: str(q.why, 2e3, `Pertanyaan ${i + 1}: pembahasan`), points: int(q.points, 1, 100, `Pertanyaan ${i + 1}: poin`, 1) };
    });
    const course = typeof d.course === "string" && ID_RE.test(d.course) ? d.course : "";
    return { ...base, minutes: int(d.minutes, 1, 300, "Estimasi menit", 5), course, questions };
  }
  if (kind === "article") {
    return {
      ...base,
      art: pick(d.art, ARTS, "conversation"),
      minutes: int(d.minutes, 1, 300, "Estimasi menit baca", 5),
      featured: d.featured === true,
      sections: arr(d.sections, 40, "Bagian artikel").map((s, j) => section(s, j, "Artikel", ctx))
    };
  }
  bad("Jenis konten tidak dikenal.");
}
function forPublish(kind, d) {
  const need = (cond, msg) => {
    if (!cond) bad(msg);
  };
  need(d.title, "Judul wajib diisi sebelum publish.");
  need(d.category, "Kategori wajib diisi sebelum publish.");
  need(d.description, "Deskripsi wajib diisi sebelum publish.");
  if (kind === "course") {
    need(d.lessons.length, "Course butuh minimal 1 modul sebelum publish.");
    d.lessons.forEach((l, i) => {
      need(l.title, `Modul ${i + 1}: judul wajib diisi.`);
      need(l.intro || l.sections.length, `Modul ${i + 1}: isi pengantar atau minimal 1 bagian.`);
      l.sections.forEach((s, j) => need(s.heading || hasRichContent(s.html) || s.image || s.video, `Modul ${i + 1}, bagian ${j + 1} masih kosong.`));
    });
    return { ...d, label: d.category.toUpperCase(), minutes: d.lessons.reduce((n, l) => n + l.duration, 0) };
  }
  if (kind === "quiz") {
    need(d.questions.length, "Quiz butuh minimal 1 pertanyaan sebelum publish.");
    d.questions.forEach((q, i) => {
      need(q.q, `Pertanyaan ${i + 1}: teks pertanyaan wajib diisi.`);
      if (q.type === "essay") return;
      need(q.options.length >= 2 && q.options.every(Boolean), `Pertanyaan ${i + 1}: isi minimal 2 pilihan dan jangan biarkan pilihan kosong.`);
      need(q.answer !== null && q.answer < q.options.length, `Pertanyaan ${i + 1}: pilih jawaban yang benar.`);
    });
    return d;
  }
  need(d.sections.length, "Artikel butuh minimal 1 bagian sebelum publish.");
  return d;
}
var ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
var escapeDeep = (v) => typeof v === "string" ? v.replace(/[&<>"']/g, (c) => ESC[c]) : Array.isArray(v) ? v.map(escapeDeep) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === "html" && typeof x === "string" ? x : escapeDeep(x)])) : v;
function slugify(title) {
  const s = String(title || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
  return s.length >= 2 ? s : "konten";
}

// server/catalog.mjs
var iso = (v) => v instanceof Date ? v.toISOString() : String(v);
var parseJson = (v) => typeof v === "string" ? JSON.parse(v) : v;
var LIST = { course: "courses", quiz: "quizzes", article: "articles" };
async function loadCatalog(db) {
  const rows = await sql(db, "SELECT kind,id,published,published_at FROM content_items WHERE published IS NOT NULL ORDER BY sort_order, created_at, id").all();
  const catalog = { courses: [], quizzes: [], articles: [] };
  for (const r of rows.results) catalog[LIST[r.kind]]?.push({ ...parseJson(r.published), id: r.id, version: iso(r.published_at) });
  return catalog;
}

// server/raport.mjs
var DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
var iso2 = (v) => v == null ? null : v instanceof Date ? v.toISOString() : new Date(v).toISOString();
var dayKey = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
var mondayOf = (key) => {
  const d = /* @__PURE__ */ new Date(key + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
};
var addDays = (key, n) => {
  const d = /* @__PURE__ */ new Date(key + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
var MAX_WEEKS = 26;
function parsePeriod(url) {
  const f = url.searchParams.get("from") || "", t = url.searchParams.get("to") || "";
  if (f && !DAY_RE.test(f) || t && !DAY_RE.test(t)) fail(422, "Format tanggal harus YYYY-MM-DD.");
  const from = f ? /* @__PURE__ */ new Date(`${f}T00:00:00+07:00`) : null, to = t ? /* @__PURE__ */ new Date(`${t}T23:59:59.999+07:00`) : null;
  if (from && isNaN(from) || to && isNaN(to)) fail(422, "Tanggal tidak valid.");
  if (from && to && from > to) fail(422, "Tanggal awal harus sebelum tanggal akhir.");
  return { from, to, fromDay: f || null, toDay: t || null };
}
async function buildRaport(db, userId, period, catalog) {
  catalog ||= await loadCatalog(db);
  const { from, to } = period;
  const u = await sql(db, "SELECT id,name,email,role,status,created_at FROM users WHERE id=?", userId).first() || fail(404, "Peserta tidak ditemukan.");
  const [p, a, r, e] = await Promise.all([
    sql(db, "SELECT course_id,lesson_id,completed_at FROM lesson_progress WHERE user_id=? ORDER BY completed_at", userId).all(),
    sql(db, "SELECT quiz_id,score,status,created_at FROM quiz_attempts WHERE user_id=? ORDER BY created_at,attempt_id", userId).all(),
    sql(db, "SELECT article_id,read_at FROM article_reads WHERE user_id=? ORDER BY read_at", userId).all(),
    sql(db, "SELECT course_id,created_at FROM enrollments WHERE user_id=?", userId).all()
  ]);
  const t = (v) => new Date(v).getTime();
  const inPeriod = (v) => (!from || t(v) >= from.getTime()) && (!to || t(v) <= to.getTime());
  const upToEnd = (v) => !to || t(v) <= to.getTime();
  const lessonEvents = [];
  const courses = [];
  for (const c of catalog.courses) {
    const byId = new Map(c.lessons.map((l) => [l.id, l]));
    const rows = p.results.filter((x) => x.course_id === c.id && byId.has(x.lesson_id));
    const enrolled = e.results.find((x) => x.course_id === c.id);
    const cumulative = rows.filter((x) => upToEnd(x.completed_at));
    const startCandidates = [enrolled?.created_at, rows[0]?.completed_at].filter(Boolean).map(t);
    const startedAt = startCandidates.length ? Math.min(...startCandidates) : null;
    if (startedAt === null || to && startedAt > to.getTime()) continue;
    const period2 = rows.filter((x) => inPeriod(x.completed_at));
    for (const x of period2) lessonEvents.push({ at: x.completed_at, minutes: byId.get(x.lesson_id).duration });
    const done = cumulative.length, total = c.lessons.length;
    courses.push({
      id: c.id,
      title: c.title,
      category: c.category,
      done,
      total,
      percent: total ? Math.round(done / total * 100) : 0,
      startedAt: iso2(startedAt),
      completedAt: done === total && total ? iso2(Math.max(...cumulative.map((x) => t(x.completed_at)))) : null,
      lessonsInPeriod: period2.length,
      minutesInPeriod: period2.reduce((s, x) => s + byId.get(x.lesson_id).duration, 0)
    });
  }
  const quizEvents = a.results.filter((x) => inPeriod(x.created_at) && catalog.quizzes.some((q) => q.id === x.quiz_id));
  const quizzes = catalog.quizzes.map((q) => {
    const all = quizEvents.filter((x) => x.quiz_id === q.id);
    if (!all.length) return null;
    const rows = all.filter((x) => x.status !== "pending"), pending = all.length - rows.length;
    const best = rows.length ? Math.max(...rows.map((x) => x.score)) : null, last = rows[rows.length - 1];
    return { id: q.id, title: q.title, category: q.category, best, last: last ? last.score : null, attempts: all.length, pending, passed: best !== null && best >= 80, firstAt: iso2(all[0].created_at), lastAt: iso2(all[all.length - 1].created_at) };
  }).filter(Boolean);
  const articles = r.results.filter((x) => inPeriod(x.read_at)).map((x) => {
    const art = catalog.articles.find((a2) => a2.id === x.article_id);
    return art ? { id: art.id, title: art.title, category: art.category, readAt: iso2(x.read_at) } : null;
  }).filter(Boolean);
  const allActivity = [...p.results.map((x) => x.completed_at), ...a.results.map((x) => x.created_at), ...r.results.map((x) => x.read_at)].filter(upToEnd).map(t);
  const lastActivity = allActivity.length ? iso2(Math.max(...allActivity)) : null;
  const endKey = dayKey(to || /* @__PURE__ */ new Date());
  const firstKey = from ? dayKey(from) : dayKey(Math.min(t(u.created_at), ...allActivity.length ? allActivity : [Date.now()]));
  let startWeek = mondayOf(firstKey);
  const endWeek = mondayOf(endKey);
  let truncated = false;
  const span = Math.round((t(endWeek) - t(startWeek)) / 6048e5) + 1;
  if (span > MAX_WEEKS) {
    startWeek = addDays(endWeek, -7 * (MAX_WEEKS - 1));
    truncated = true;
  }
  const weeks = [];
  for (let w = startWeek; w <= endWeek; w = addDays(w, 7)) weeks.push({ week: w, minutes: 0, lessons: 0, quizzes: 0 });
  const bucket = (at) => weeks.find((x) => x.week === mondayOf(dayKey(at)));
  for (const ev of lessonEvents) {
    const b2 = bucket(ev.at);
    if (b2) {
      b2.minutes += ev.minutes;
      b2.lessons++;
    }
  }
  for (const ev of quizEvents) {
    const b2 = bucket(ev.created_at);
    if (b2) b2.quizzes++;
  }
  const bests = quizzes.map((q) => q.best).filter((b2) => b2 !== null);
  return {
    user: { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, joinedAt: iso2(u.created_at), lastActivity },
    period: { from: period.fromDay, to: period.toDay },
    summary: {
      coursesAvailable: catalog.courses.length,
      coursesFollowed: courses.length,
      coursesCompleted: courses.filter((c) => c.completedAt).length,
      lessonsCompleted: lessonEvents.length,
      minutes: lessonEvents.reduce((s, x) => s + x.minutes, 0),
      quizzesAttempted: quizzes.length,
      quizzesPending: quizzes.filter((q) => q.pending && q.best === null).length,
      quizzesPassed: quizzes.filter((q) => q.passed).length,
      avgBest: bests.length ? Math.round(bests.reduce((s, x) => s + x, 0) / bests.length) : null,
      articlesRead: articles.length
    },
    courses,
    quizzes,
    articles,
    weekly: { weeks, truncated },
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// server/core.mjs
var iso3 = (v) => v instanceof Date ? v.toISOString() : String(v);
var parseJson2 = (v) => typeof v === "string" ? JSON.parse(v) : v;
function safeCatalog(catalog) {
  return escapeDeep({
    courses: catalog.courses.map(({ version, ...c }) => c),
    quizzes: catalog.quizzes.map(({ version, ...q }) => ({ ...q, questions: q.questions.map(({ q: q2, options, type, points }) => ({ q: q2, type: type || "mc", options: type === "essay" ? [] : options, points: points || 1 })) })),
    articles: catalog.articles.map(({ version, ...a }) => ({ ...a, publishedAt: version }))
  });
}
var find2 = (list, id, message) => list.find((x) => x.id === id) || fail(404, message);
async function learningState(db, userId, catalog) {
  const [p, e, b2, r, a] = await Promise.all([
    sql(db, "SELECT course_id,lesson_id,completed_at FROM lesson_progress WHERE user_id=? ORDER BY completed_at", userId).all(),
    sql(db, "SELECT course_id FROM enrollments WHERE user_id=? ORDER BY created_at", userId).all(),
    sql(db, "SELECT kind,content_id FROM bookmarks WHERE user_id=? ORDER BY created_at", userId).all(),
    sql(db, "SELECT article_id FROM article_reads WHERE user_id=?", userId).all(),
    sql(db, "SELECT quiz_id,score,status,created_at FROM quiz_attempts WHERE user_id=? ORDER BY created_at,attempt_id", userId).all()
  ]);
  const has = (list, id) => list.some((x) => x.id === id);
  const progress = Object.fromEntries(catalog.courses.map((c) => [c.id, []]));
  const activity = [];
  const dateFormat = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
  for (const row of p.results) {
    const c = catalog.courses.find((c2) => c2.id === row.course_id);
    const index = c ? c.lessons.findIndex((l) => l.id === row.lesson_id) : -1;
    if (index < 0) continue;
    progress[c.id].push(index);
    activity.push({ date: dateFormat.format(new Date(row.completed_at)), minutes: c.lessons[index].duration });
  }
  const results = {};
  const pending = {};
  for (const row of a.results) {
    if (row.status === "pending") {
      if (has(catalog.quizzes, row.quiz_id)) pending[row.quiz_id] = (pending[row.quiz_id] || 0) + 1;
      continue;
    }
    if (!has(catalog.quizzes, row.quiz_id)) continue;
    const prev = results[row.quiz_id];
    results[row.quiz_id] = { score: Math.max(prev?.score || 0, row.score), lastScore: row.score, attempts: (prev?.attempts || 0) + 1, date: iso3(row.created_at) };
  }
  return {
    version: 3,
    progress,
    enrolled: e.results.map((x) => x.course_id).filter((id) => has(catalog.courses, id)),
    savedCourses: b2.results.filter((x) => x.kind === "course" && has(catalog.courses, x.content_id)).map((x) => x.content_id),
    savedArticles: b2.results.filter((x) => x.kind === "article" && has(catalog.articles, x.content_id)).map((x) => x.content_id),
    readArticles: r.results.map((x) => x.article_id).filter((id) => has(catalog.articles, id)),
    results,
    pending,
    activity
  };
}
function attemptResult(record) {
  const pending = record.status === "pending";
  const review = parseJson2(record.review).map((r) => r.type === "essay" ? (({ rubric, ...rest }) => pending ? rest : { ...rest, why: rubric || "" })(r) : r);
  return escapeDeep({
    id: record.attempt_id,
    status: record.status || "graded",
    score: record.score,
    passed: !pending && record.score >= 80,
    correct: review.filter((r) => r.type !== "essay" && r.correct).length,
    total: review.length,
    mcTotal: review.filter((r) => r.type !== "essay").length,
    essays: review.filter((r) => r.type === "essay").length,
    earnedPoints: record.earned_points === null || record.earned_points === void 0 ? null : Number(record.earned_points),
    maxPoints: record.max_points ?? null,
    answers: parseJson2(record.answers),
    review,
    quizId: record.quiz_id,
    createdAt: iso3(record.created_at),
    gradedAt: record.graded_at ? iso3(record.graded_at) : null
  });
}
async function api(request, { db, user, origin }) {
  try {
    if (!user?.id) fail(401, "Silakan masuk untuk melanjutkan.");
    const path = new URL(request.url).pathname, method = request.method;
    protectMutation(request, origin);
    const catalog = await loadCatalog(db);
    if (path === "/api/catalog" && method === "GET") return json(safeCatalog(catalog));
    if (path === "/api/me/raport" && method === "GET") return json(await buildRaport(db, user.id, parsePeriod(new URL(request.url)), catalog));
    if (path === "/api/me" && method === "GET") return json({ profile: { id: user.id, name: user.name, email: user.email, role: user.role || "learner" }, state: await learningState(db, user.id, catalog) });
    let m;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (method === "POST" && (m = path.match(/^\/api\/courses\/([a-z0-9-]+)\/enroll$/))) {
      find2(catalog.courses, m[1], "Course tidak ditemukan.");
      await bodyJSON(request);
      await sql(db, "INSERT INTO enrollments(user_id,course_id,created_at) VALUES(?,?,?) ON CONFLICT DO NOTHING", user.id, m[1], now).run();
    } else if (method === "POST" && (m = path.match(/^\/api\/courses\/([a-z0-9-]+)\/lessons\/(\d+)\/complete$/))) {
      const c = find2(catalog.courses, m[1], "Course tidak ditemukan."), data = await bodyJSON(request);
      const lesson = typeof data.lessonId === "string" ? c.lessons.find((l) => l.id === data.lessonId) : c.lessons[Number(m[2])];
      if (!lesson) fail(404, "Modul tidak ditemukan. Muat ulang halaman.");
      await db.batch([
        sql(db, "INSERT INTO enrollments(user_id,course_id,created_at) VALUES(?,?,?) ON CONFLICT DO NOTHING", user.id, c.id, now),
        sql(db, "INSERT INTO lesson_progress(user_id,course_id,lesson_id,completed_at) VALUES(?,?,?,?) ON CONFLICT DO NOTHING", user.id, c.id, lesson.id, now)
      ]);
    } else if (path === "/api/bookmarks" && method === "POST") {
      const data = await bodyJSON(request);
      if (!["course", "article"].includes(data.kind) || typeof data.saved !== "boolean" || typeof data.id !== "string") fail(422, "Jenis, ID, dan status simpan tidak valid.");
      find2(data.kind === "course" ? catalog.courses : catalog.articles, data.id, data.kind === "course" ? "Course tidak ditemukan." : "Artikel tidak ditemukan.");
      if (data.saved) await sql(db, "INSERT INTO bookmarks(user_id,kind,content_id,created_at) VALUES(?,?,?,?) ON CONFLICT DO NOTHING", user.id, data.kind, data.id, now).run();
      else await sql(db, "DELETE FROM bookmarks WHERE user_id=? AND kind=? AND content_id=?", user.id, data.kind, data.id).run();
    } else if (method === "POST" && (m = path.match(/^\/api\/articles\/([a-z0-9-]+)\/read$/))) {
      find2(catalog.articles, m[1], "Artikel tidak ditemukan.");
      await bodyJSON(request);
      await sql(db, "INSERT INTO article_reads(user_id,article_id,read_at) VALUES(?,?,?) ON CONFLICT DO NOTHING", user.id, m[1], now).run();
    } else if (method === "POST" && (m = path.match(/^\/api\/quizzes\/([a-z0-9-]+)\/attempts$/))) {
      const q = find2(catalog.quizzes, m[1], "Quiz tidak ditemukan."), data = await bodyJSON(request, 256 * 1024);
      if (typeof data.attemptId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.attemptId)) fail(422, "ID percobaan tidak valid.");
      const validAnswer = (v, question) => question.type === "essay" ? typeof v === "string" && v.trim().length > 0 && v.length <= 5e3 : Number.isInteger(v) && v >= 0 && v < question.options.length;
      if (!Array.isArray(data.answers) || data.answers.length !== q.questions.length || data.answers.some((v, i) => !validAnswer(v, q.questions[i]))) fail(422, "Jawab semua pertanyaan (essay maksimal 5.000 karakter). Jika quiz baru diperbarui, muat ulang halaman.");
      const review = q.questions.map((question, i) => {
        const points = question.points || 1;
        if (question.type === "essay") return { type: "essay", q: question.q, points, answerText: data.answers[i].trim(), earned: null, feedback: "", rubric: question.rubric || "" };
        const correct = data.answers[i] === question.answer;
        return { type: "mc", q: question.q, options: question.options, selected: data.answers[i], answer: question.answer, correct, why: question.why, points, earned: correct ? points : 0 };
      });
      const maxPoints = review.reduce((s, r) => s + r.points, 0), mcEarned = review.reduce((s, r) => s + (r.earned || 0), 0);
      const hasEssay = review.some((r) => r.type === "essay");
      const score = hasEssay ? null : Math.round(mcEarned / maxPoints * 100);
      await sql(
        db,
        "INSERT INTO quiz_attempts(user_id,attempt_id,quiz_id,score,status,max_points,earned_points,answers,review,content_version,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING",
        user.id,
        data.attemptId,
        q.id,
        score,
        hasEssay ? "pending" : "graded",
        maxPoints,
        mcEarned,
        JSON.stringify(data.answers),
        JSON.stringify(review),
        q.version,
        now
      ).run();
      const record = await sql(db, "SELECT * FROM quiz_attempts WHERE user_id=? AND attempt_id=?", user.id, data.attemptId).first();
      if (record.quiz_id !== q.id || record.answers !== JSON.stringify(data.answers)) fail(409, "ID percobaan telah digunakan untuk jawaban yang berbeda.");
      return json({ result: attemptResult(record), state: await learningState(db, user.id, catalog) });
    } else if (method === "GET" && (m = path.match(/^\/api\/quizzes\/([a-z0-9-]+)\/attempts$/))) {
      const q = find2(catalog.quizzes, m[1], "Quiz tidak ditemukan.");
      const records = await sql(db, "SELECT * FROM quiz_attempts WHERE user_id=? AND quiz_id=? ORDER BY created_at DESC LIMIT 50", user.id, q.id).all();
      return json({ attempts: records.results.map(attemptResult) });
    } else fail(404, "Endpoint tidak ditemukan.");
    return json({ state: await learningState(db, user.id, catalog) });
  } catch (error) {
    if (!(error instanceof HttpError)) console.error("Learning API error:", error.message);
    return json({ error: error instanceof HttpError ? error.message : "Server mengalami kendala. Coba lagi." }, error.status || 500);
  }
}

// server/admin.mjs
import { randomUUID } from "node:crypto";
var iso4 = (v) => v == null ? null : v instanceof Date ? v.toISOString() : String(v);
var parseJson3 = (v) => typeof v === "string" ? JSON.parse(v) : v;
var EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
var NAME_RE = /^[\p{L}\p{N} .,'()-]{2,80}$/u;
var IMAGE_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
function status(row) {
  if (!row.published_at) return "draft";
  return row.revision > row.published_revision ? "changed" : "published";
}
function summary(row) {
  const d = parseJson3(row.draft);
  return {
    kind: row.kind,
    id: row.id,
    title: d.title || "(tanpa judul)",
    category: d.category || "",
    count: row.kind === "course" ? d.lessons?.length || 0 : row.kind === "quiz" ? d.questions?.length || 0 : d.sections?.length || 0,
    status: status(row),
    revision: row.revision,
    sortOrder: row.sort_order,
    updatedAt: iso4(row.updated_at),
    publishedAt: iso4(row.published_at),
    updatedBy: row.updated_by_name || null
  };
}
var CONTENT_COLUMNS = "c.kind,c.id,c.draft,c.published_at,c.sort_order,c.revision,c.updated_at,c.published_revision,u.name AS updated_by_name";
async function getItem(db, kind, id) {
  const row = await sql(db, `SELECT ${CONTENT_COLUMNS} FROM content_items c LEFT JOIN users u ON u.id=c.updated_by WHERE c.kind=? AND c.id=?`, kind, id).first();
  return row || fail(404, "Konten tidak ditemukan.");
}
var full = (row) => ({ ...summary(row), draft: parseJson3(row.draft) });
async function userList(db) {
  const rows = await sql(db, `SELECT au.id, au.email, au.created_at, au.last_sign_in_at,
      COALESCE(u.name, au.raw_user_meta_data->>'full_name', split_part(au.email,'@',1)) AS name,
      COALESCE(u.role,'learner') AS role, COALESCE(u.status,'active') AS status,
      (SELECT count(*) FROM enrollments e WHERE e.user_id=au.id) AS courses_enrolled,
      (SELECT count(*) FROM lesson_progress p WHERE p.user_id=au.id) AS lessons_completed,
      (SELECT count(DISTINCT quiz_id) FROM quiz_attempts a WHERE a.user_id=au.id AND a.score>=80) AS quizzes_passed,
      (SELECT max(x) FROM (SELECT max(completed_at) AS x FROM lesson_progress p WHERE p.user_id=au.id
         UNION ALL SELECT max(created_at) FROM quiz_attempts a WHERE a.user_id=au.id) s) AS last_activity
    FROM auth.users au LEFT JOIN users u ON u.id=au.id ORDER BY lower(COALESCE(u.name, au.email))`).all();
  return rows.results.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    status: r.status === "disabled" ? "disabled" : r.last_sign_in_at ? "active" : "invited",
    createdAt: iso4(r.created_at),
    lastSignInAt: iso4(r.last_sign_in_at),
    lastActivity: iso4(r.last_activity),
    coursesEnrolled: Number(r.courses_enrolled),
    lessonsCompleted: Number(r.lessons_completed),
    quizzesPassed: Number(r.quizzes_passed)
  }));
}
async function authUser(db, id) {
  return await sql(db, `SELECT au.id, au.email, au.last_sign_in_at, COALESCE(u.name, au.raw_user_meta_data->>'full_name', split_part(au.email,'@',1)) AS name
    FROM auth.users au LEFT JOIN users u ON u.id=au.id WHERE au.id=?`, id).first() || fail(404, "Peserta tidak ditemukan.");
}
async function ensureRow(db, u) {
  await sql(db, "INSERT INTO users(id,name,email,created_at) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING", u.id, u.name, u.email, (/* @__PURE__ */ new Date()).toISOString()).run();
}
async function publishedCatalogLite(db) {
  const rows = await sql(db, "SELECT kind,id,published FROM content_items WHERE published IS NOT NULL ORDER BY sort_order, created_at, id").all();
  return rows.results.map((r) => ({ kind: r.kind, id: r.id, ...parseJson3(r.published) }));
}
async function adminApi(request, { db, user, origin, config: config2, admin }) {
  try {
    const url = new URL(request.url), path = url.pathname, method = request.method;
    protectMutation(request, origin);
    const ctx = { supabaseUrl: config2.supabaseUrl };
    let m;
    if (path === "/api/admin/content" && method === "GET") {
      const rows = await sql(db, `SELECT ${CONTENT_COLUMNS} FROM content_items c LEFT JOIN users u ON u.id=c.updated_by ORDER BY c.kind, c.sort_order, c.created_at, c.id`).all();
      return json({ items: rows.results.map(summary) });
    }
    if ((m = path.match(/^\/api\/admin\/content\/(course|quiz|article)\/([a-z0-9-]+)$/)) && method === "GET") {
      return json({ item: full(await getItem(db, m[1], m[2])) });
    }
    if ((m = path.match(/^\/api\/admin\/content\/(course|quiz|article)$/)) && method === "POST") {
      const kind = m[1], body = await bodyJSON(request, 512 * 1024);
      const draft = normalize(kind, body.draft || {}, ctx);
      const base = slugify(draft.title);
      let id = base;
      for (let n = 2; await sql(db, "SELECT 1 AS x FROM content_items WHERE kind=? AND id=?", kind, id).first(); n++) id = `${base.slice(0, 54)}-${n}`;
      const order = await sql(db, "SELECT COALESCE(max(sort_order),0)+10 AS n FROM content_items WHERE kind=?", kind).first();
      await sql(db, "INSERT INTO content_items(kind,id,draft,sort_order,updated_by) VALUES(?,?,?::jsonb,?,?)", kind, id, JSON.stringify(draft), Number(order.n), user.id).run();
      return json({ item: full(await getItem(db, kind, id)) }, 201);
    }
    if ((m = path.match(/^\/api\/admin\/content\/(course|quiz|article)\/reorder$/)) && method === "POST") {
      const body = await bodyJSON(request, 64 * 1024);
      if (!Array.isArray(body.ids) || !body.ids.every((id) => typeof id === "string" && ID_RE.test(id))) fail(422, "Urutan tidak valid.");
      await db.batch(body.ids.map((id, i) => sql(db, "UPDATE content_items SET sort_order=? WHERE kind=? AND id=?", (i + 1) * 10, m[1], id)));
      return json({ ok: true });
    }
    if ((m = path.match(/^\/api\/admin\/content\/(course|quiz|article)\/([a-z0-9-]+)(?:\/(publish|unpublish|delete))?$/)) && method === "POST") {
      const [, kind, id, action] = m;
      const body = await bodyJSON(request, 512 * 1024);
      const row = await getItem(db, kind, id);
      if (body.baseRevision !== void 0 && body.baseRevision !== row.revision) fail(409, `Konten ini baru saja diubah${row.updated_by_name ? " oleh " + row.updated_by_name : ""}. Muat ulang untuk melihat versi terbaru.`);
      if (!action) {
        const draft = normalize(kind, body.draft, ctx);
        await sql(db, "UPDATE content_items SET draft=?::jsonb, revision=revision+1, updated_at=now(), updated_by=? WHERE kind=? AND id=?", JSON.stringify(draft), user.id, kind, id).run();
      } else if (action === "publish") {
        const draft = normalize(kind, parseJson3(row.draft), ctx);
        if (kind === "quiz" && draft.course) {
          const course = await sql(db, "SELECT 1 AS x FROM content_items WHERE kind=? AND id=? AND published IS NOT NULL", "course", draft.course).first();
          if (!course) fail(422, "Course terkait quiz ini belum tayang. Publish course-nya dulu atau kosongkan pilihan course.");
        }
        const published = forPublish(kind, draft);
        await sql(db, "UPDATE content_items SET published=?::jsonb, published_at=now(), published_revision=revision, updated_by=? WHERE kind=? AND id=?", JSON.stringify(published), user.id, kind, id).run();
      } else if (action === "unpublish") {
        await sql(db, "UPDATE content_items SET published=NULL, published_at=NULL, published_revision=NULL, updated_by=? WHERE kind=? AND id=?", user.id, kind, id).run();
      } else if (action === "delete") {
        if (row.published_at) fail(409, "Sembunyikan konten ini dulu (Unpublish) sebelum menghapusnya.");
        await sql(db, "DELETE FROM content_items WHERE kind=? AND id=?", kind, id).run();
        return json({ ok: true });
      }
      return json({ item: full(await getItem(db, kind, id)) });
    }
    if (path === "/api/admin/media/upload-url" && method === "POST") {
      const body = await bodyJSON(request);
      const ext = IMAGE_TYPES[body.contentType];
      if (!ext) fail(422, "Format gambar harus PNG, JPG, WEBP, atau GIF.");
      if (!Number.isInteger(body.size) || body.size <= 0 || body.size > 5 * 1024 * 1024) fail(422, "Ukuran gambar maksimal 5 MB.");
      const d = /* @__PURE__ */ new Date(), objectPath = `content/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${ext}`;
      const { uploadUrl } = await admin.signUpload(objectPath);
      return json({ uploadUrl, publicUrl: mediaPrefix(config2.supabaseUrl) + objectPath });
    }
    if (path === "/api/admin/users" && method === "GET") return json({ users: await userList(db), me: user.id });
    if (path === "/api/admin/users/invite" && method === "POST") {
      const body = await bodyJSON(request);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const role = body.role === "admin" ? "admin" : "learner";
      if (!EMAIL_RE.test(email) || email.length > 254) fail(422, "Email tidak valid.");
      if (!NAME_RE.test(name)) fail(422, "Isi nama 2\u201380 karakter.");
      if (await sql(db, "SELECT 1 AS x FROM auth.users WHERE lower(email)=?", email).first()) fail(409, "Email ini sudah terdaftar.");
      const { id } = await admin.invite(email, { name, redirectTo: origin + "/" });
      await sql(db, "INSERT INTO users(id,name,email,role,created_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET role=excluded.role", id, name, email, role, (/* @__PURE__ */ new Date()).toISOString()).run();
      return json({ ok: true, users: await userList(db) }, 201);
    }
    if ((m = path.match(/^\/api\/admin\/users\/([0-9a-f-]{36})\/raport$/)) && method === "GET") {
      const u = await authUser(db, m[1]);
      await ensureRow(db, u);
      return json(await buildRaport(db, u.id, parsePeriod(url)));
    }
    if ((m = path.match(/^\/api\/admin\/users\/([0-9a-f-]{36})$/)) && method === "GET") {
      const u = await authUser(db, m[1]);
      const catalog = await publishedCatalogLite(db);
      const [p, a, r] = await Promise.all([
        sql(db, "SELECT course_id,lesson_id FROM lesson_progress WHERE user_id=?", u.id).all(),
        sql(db, "SELECT quiz_id,max(score) AS best,count(*) AS attempts,max(created_at) AS last FROM quiz_attempts WHERE user_id=? AND status='graded' GROUP BY quiz_id", u.id).all(),
        sql(db, "SELECT count(*) AS n FROM article_reads WHERE user_id=?", u.id).first()
      ]);
      const courses = catalog.filter((c) => c.kind === "course").map((c) => {
        const done = p.results.filter((x) => x.course_id === c.id && c.lessons.some((l) => l.id === x.lesson_id)).length;
        return { id: c.id, title: c.title, done, total: c.lessons.length };
      });
      const quizzes = catalog.filter((q) => q.kind === "quiz").map((q) => {
        const x = a.results.find((x2) => x2.quiz_id === q.id);
        return { id: q.id, title: q.title, best: x ? Number(x.best) : null, attempts: x ? Number(x.attempts) : 0, last: iso4(x?.last) };
      });
      return json({ user: { id: u.id, name: u.name, email: u.email }, courses, quizzes, articlesRead: Number(r.n) });
    }
    if ((m = path.match(/^\/api\/admin\/users\/([0-9a-f-]{36})\/(role|status|resend)$/)) && method === "POST") {
      const [, id, action] = m, body = await bodyJSON(request);
      if (id === user.id && action !== "resend") fail(409, "Kamu tidak bisa mengubah role atau status akunmu sendiri. Minta admin lain melakukannya.");
      const u = await authUser(db, id);
      await ensureRow(db, u);
      if (action === "role") {
        if (!["admin", "learner"].includes(body.role)) fail(422, "Role tidak valid.");
        await sql(db, "UPDATE users SET role=? WHERE id=?", body.role, id).run();
      } else if (action === "status") {
        if (!["active", "disabled"].includes(body.status)) fail(422, "Status tidak valid.");
        await admin.setBanned(id, body.status === "disabled");
        await sql(db, "UPDATE users SET status=? WHERE id=?", body.status, id).run();
      } else {
        if (u.last_sign_in_at) fail(409, 'Peserta ini sudah pernah masuk. Minta dia memakai "Lupa password?" bila perlu.');
        await admin.invite(u.email, { name: u.name, redirectTo: origin + "/" }).catch((e) => {
          if (e.status === 409) fail(409, "Supabase menolak undangan ulang untuk email ini. Hapus user di Supabase lalu undang lagi.");
          throw e;
        });
      }
      return json({ ok: true, users: await userList(db) });
    }
    if (path === "/api/admin/scores" && method === "GET") {
      const period = parsePeriod(url);
      const catalog = (await publishedCatalogLite(db)).filter((x) => x.kind === "quiz");
      const ids = new Set(catalog.map((q) => q.id));
      const conds = [], args = [];
      if (period.from) {
        conds.push("created_at >= ?");
        args.push(period.from.toISOString());
      }
      if (period.to) {
        conds.push("created_at <= ?");
        args.push(period.to.toISOString());
      }
      const rows = await sql(db, `SELECT user_id,quiz_id,score,status,created_at FROM quiz_attempts ${conds.length ? "WHERE " + conds.join(" AND ") : ""} ORDER BY created_at, attempt_id`, ...args).all();
      const cells = {};
      for (const r of rows.results) {
        if (!ids.has(r.quiz_id)) continue;
        const u = cells[r.user_id] ||= {}, c = u[r.quiz_id] ||= { best: null, last: null, attempts: 0, pending: 0, lastAt: null };
        c.attempts++;
        c.lastAt = iso4(r.created_at);
        if (r.status === "pending") {
          c.pending++;
          continue;
        }
        c.best = Math.max(c.best ?? 0, r.score);
        c.last = r.score;
      }
      const users = (await userList(db)).map(({ id, name, email, role, status: status2 }) => ({ id, name, email, role, status: status2 }));
      return json({ quizzes: catalog.map((q) => ({ id: q.id, title: q.title, category: q.category, questions: q.questions.length })), users, cells, period: { from: period.fromDay, to: period.toDay }, generatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
    if (path === "/api/admin/report" && method === "GET") {
      const catalog = await publishedCatalogLite(db);
      const [p, e, a] = await Promise.all([
        sql(db, "SELECT user_id,course_id,lesson_id FROM lesson_progress").all(),
        sql(db, "SELECT user_id,course_id FROM enrollments").all(),
        sql(db, "SELECT user_id,quiz_id,max(score) AS best,count(*) AS attempts FROM quiz_attempts WHERE status='graded' GROUP BY user_id,quiz_id").all()
      ]);
      const courses = catalog.filter((c) => c.kind === "course").map((c) => {
        const ids = new Set(c.lessons.map((l) => l.id)), per = /* @__PURE__ */ new Map();
        for (const x of p.results) if (x.course_id === c.id && ids.has(x.lesson_id)) per.set(x.user_id, (per.get(x.user_id) || 0) + 1);
        const enrolled = new Set(e.results.filter((x) => x.course_id === c.id).map((x) => x.user_id));
        for (const u of per.keys()) enrolled.add(u);
        const completed = [...per.values()].filter((n) => n === c.lessons.length).length;
        const avg = enrolled.size ? Math.round([...enrolled].reduce((s, u) => s + (per.get(u) || 0) / c.lessons.length, 0) / enrolled.size * 100) : 0;
        return { id: c.id, title: c.title, lessons: c.lessons.length, enrolled: enrolled.size, completed, avgProgress: avg };
      });
      const quizzes = catalog.filter((q) => q.kind === "quiz").map((q) => {
        const rows = a.results.filter((x) => x.quiz_id === q.id);
        return { id: q.id, title: q.title, takers: rows.length, passed: rows.filter((x) => Number(x.best) >= 80).length, avgBest: rows.length ? Math.round(rows.reduce((s, x) => s + Number(x.best), 0) / rows.length) : null, attempts: rows.reduce((s, x) => s + Number(x.attempts), 0) };
      });
      return json({ courses, quizzes, users: await userList(db), generatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
    const QUIZ_TITLE = "COALESCE(ci.published->>'title', ci.draft->>'title', a.quiz_id)";
    if (path === "/api/admin/grading/count" && method === "GET") {
      const r = await sql(db, "SELECT count(*) AS n FROM quiz_attempts WHERE status='pending'").first();
      return json({ pending: Number(r.n) });
    }
    if (path === "/api/admin/grading" && method === "GET") {
      const graded = url.searchParams.get("status") === "graded";
      const rows = await sql(db, `SELECT a.user_id,a.attempt_id,a.quiz_id,a.created_at,a.graded_at,a.score,a.status,u.name,u.email,g.name AS grader,${QUIZ_TITLE} AS quiz_title
        FROM quiz_attempts a JOIN users u ON u.id=a.user_id LEFT JOIN users g ON g.id=a.graded_by LEFT JOIN content_items ci ON ci.kind='quiz' AND ci.id=a.quiz_id
        WHERE ${graded ? `a.status='graded' AND a.review LIKE '%"type":"essay"%'` : "a.status='pending'"}
        ORDER BY ${graded ? "a.graded_at DESC NULLS LAST" : "a.created_at ASC"} LIMIT 200`).all();
      return json({ items: rows.results.map((r) => ({ userId: r.user_id, attemptId: r.attempt_id, quizId: r.quiz_id, quizTitle: r.quiz_title, name: r.name, email: r.email, createdAt: iso4(r.created_at), gradedAt: iso4(r.graded_at), score: r.score, status: r.status, grader: r.grader })) });
    }
    if (m = path.match(/^\/api\/admin\/grading\/([0-9a-f-]{36})\/([0-9a-f-]{36})$/)) {
      const [, uid2, aid] = m;
      const rec = await sql(db, `SELECT a.*,u.name,u.email,g.name AS grader,${QUIZ_TITLE} AS quiz_title FROM quiz_attempts a JOIN users u ON u.id=a.user_id LEFT JOIN users g ON g.id=a.graded_by LEFT JOIN content_items ci ON ci.kind='quiz' AND ci.id=a.quiz_id WHERE a.user_id=? AND a.attempt_id=?`, uid2, aid).first() || fail(404, "Percobaan quiz tidak ditemukan.");
      const review = parseJson3(rec.review);
      if (!review.some((r) => r.type === "essay")) fail(409, "Percobaan ini tidak berisi essay.");
      if (method === "POST") {
        const body = await bodyJSON(request, 128 * 1024);
        if (!Array.isArray(body.grades)) fail(422, "Data nilai tidak valid.");
        review.forEach((r, i) => {
          if (r.type !== "essay") return;
          const g = body.grades.find((x) => x && x.index === i);
          const earned2 = g ? Number(g.earned) : NaN;
          if (!Number.isFinite(earned2) || earned2 < 0 || earned2 > r.points || Math.round(earned2 * 2) !== earned2 * 2) fail(422, `Pertanyaan ${i + 1}: isi nilai 0\u2013${r.points} (kelipatan 0,5).`);
          const feedback = typeof g.feedback === "string" ? g.feedback.trim() : "";
          if (feedback.length > 2e3) fail(422, `Pertanyaan ${i + 1}: komentar maksimal 2.000 karakter.`);
          r.earned = earned2;
          r.feedback = feedback;
        });
        const max = review.reduce((s, r) => s + r.points, 0), earned = review.reduce((s, r) => s + (r.earned || 0), 0);
        const score = Math.round(earned / max * 100);
        await sql(db, "UPDATE quiz_attempts SET review=?, score=?, status='graded', earned_points=?, max_points=?, graded_at=now(), graded_by=? WHERE user_id=? AND attempt_id=?", JSON.stringify(review), score, earned, max, user.id, uid2, aid).run();
        return json({ ok: true, score, pending: Number((await sql(db, "SELECT count(*) AS n FROM quiz_attempts WHERE status='pending'").first()).n) });
      }
      if (method === "GET") return json({ attempt: {
        userId: uid2,
        attemptId: aid,
        quizId: rec.quiz_id,
        quizTitle: rec.quiz_title,
        name: rec.name,
        email: rec.email,
        status: rec.status,
        score: rec.score,
        earnedPoints: rec.earned_points === null ? null : Number(rec.earned_points),
        maxPoints: rec.max_points,
        createdAt: iso4(rec.created_at),
        gradedAt: iso4(rec.graded_at),
        grader: rec.grader,
        review
      } });
    }
    if (path === "/api/admin/export/quizzes" && method === "GET") {
      const rows = await sql(db, "SELECT id,draft,published_at FROM content_items WHERE kind='quiz' ORDER BY sort_order, created_at, id").all();
      return json({ quizzes: rows.results.map((r) => ({ id: r.id, published: Boolean(r.published_at), ...parseJson3(r.draft) })) });
    }
    if (path === "/api/admin/import/quizzes" && method === "POST") {
      const body = await bodyJSON(request, 4 * 1024 * 1024);
      if (!Array.isArray(body.quizzes) || !body.quizzes.length) fail(422, "File tidak berisi quiz.");
      if (body.quizzes.length > 100) fail(422, "Maksimal 100 quiz per file.");
      const errors = [], items = [], plans = [];
      const courses = new Set((await sql(db, "SELECT id FROM content_items WHERE kind='course'").all()).results.map((r) => r.id));
      for (const qz of body.quizzes) {
        const where = qz.row ? `Baris ${qz.row}` : `Quiz "${qz.title || qz.id}"`;
        let existing = null;
        if (qz.id) {
          existing = await sql(db, "SELECT id,draft,published_at,revision FROM content_items WHERE kind='quiz' AND id=?", String(qz.id)).first();
          if (!existing) {
            errors.push({ row: qz.row, message: `${where}: quiz_id "${qz.id}" tidak ditemukan. Kosongkan quiz_id untuk membuat quiz baru.` });
            continue;
          }
        }
        const base = existing ? parseJson3(existing.draft) : { title: "", category: "", description: "", minutes: 5, color: "peach", course: "", questions: [] };
        const pick2 = (v, fallback) => v === void 0 || v === null || String(v).trim() === "" ? fallback : v;
        const draftIn = { ...base, title: pick2(qz.title, base.title), category: pick2(qz.category, base.category), description: pick2(qz.description, base.description), minutes: pick2(qz.minutes, base.minutes), course: pick2(qz.course, base.course) };
        if (!draftIn.title) {
          errors.push({ row: qz.row, message: `${where}: judul_quiz wajib diisi untuk quiz baru.` });
          continue;
        }
        if (draftIn.course && !courses.has(String(draftIn.course))) errors.push({ row: qz.row, message: `${where}: course_id "${draftIn.course}" tidak ditemukan.` });
        if (!Array.isArray(qz.questions) || !qz.questions.length) {
          errors.push({ row: qz.row, message: `${where}: quiz "${draftIn.title}" tidak punya pertanyaan.` });
          continue;
        }
        draftIn.questions = [];
        for (const q of qz.questions) {
          const at = `Baris ${q.row ?? "?"}`;
          const type = String(q.type || "pg").trim().toLowerCase();
          if (!["pg", "pilihan ganda", "mc", "essay", "esai"].includes(type)) {
            errors.push({ row: q.row, message: `${at}: tipe harus PG atau Essay.` });
            continue;
          }
          const text = String(q.q ?? "").trim();
          if (!text) {
            errors.push({ row: q.row, message: `${at}: pertanyaan kosong.` });
            continue;
          }
          const points = pick2(q.points, void 0);
          if (points !== void 0 && !(Number.isInteger(Number(points)) && Number(points) >= 1 && Number(points) <= 100)) {
            errors.push({ row: q.row, message: `${at}: poin harus angka bulat 1\u2013100.` });
            continue;
          }
          if (type === "essay" || type === "esai") {
            draftIn.questions.push({ type: "essay", q: text, points, rubric: String(q.explanation ?? "") });
            continue;
          }
          const options = (Array.isArray(q.options) ? q.options : []).map((o) => String(o ?? "").trim());
          while (options.length && !options[options.length - 1]) options.pop();
          if (options.length < 2 || options.some((o) => !o)) {
            errors.push({ row: q.row, message: `${at}: isi minimal 2 pilihan berurutan (A, B, \u2026) tanpa yang kosong di tengah.` });
            continue;
          }
          const letter = String(q.answer ?? "").trim().toUpperCase();
          const answer = /^[A-F]$/.test(letter) ? letter.charCodeAt(0) - 65 : /^[1-6]$/.test(letter) ? Number(letter) - 1 : -1;
          if (answer < 0 || answer >= options.length) {
            errors.push({ row: q.row, message: `${at}: jawaban_benar harus huruf A\u2013${String.fromCharCode(64 + options.length)}.` });
            continue;
          }
          draftIn.questions.push({ type: "mc", q: text, options, answer, why: String(q.explanation ?? ""), points });
        }
        let draft;
        try {
          draft = normalize("quiz", draftIn, ctx);
        } catch (e) {
          errors.push({ row: qz.row, message: `${where}: ${e.message}` });
          continue;
        }
        let warning = "";
        try {
          forPublish("quiz", structuredClone(draft));
        } catch (e) {
          warning = e.message;
        }
        items.push({ id: existing?.id || null, title: draft.title, action: existing ? "update" : "create", questions: draft.questions.length, essays: draft.questions.filter((q) => q.type === "essay").length, published: Boolean(existing?.published_at), warning });
        plans.push({ existing, draft });
      }
      const summary2 = { create: items.filter((i) => i.action === "create").length, update: items.filter((i) => i.action === "update").length, questions: items.reduce((s, i) => s + i.questions, 0) };
      if (errors.length || body.dryRun) return json({ dryRun: true, ok: !errors.length, errors, items, summary: summary2 });
      for (const { existing, draft } of plans) {
        if (existing) await sql(db, "UPDATE content_items SET draft=?::jsonb, revision=revision+1, updated_at=now(), updated_by=? WHERE kind='quiz' AND id=?", JSON.stringify(draft), user.id, existing.id).run();
        else {
          const base = slugify(draft.title);
          let id = base;
          for (let n = 2; await sql(db, "SELECT 1 AS x FROM content_items WHERE kind='quiz' AND id=?", id).first(); n++) id = `${base.slice(0, 54)}-${n}`;
          const order = await sql(db, "SELECT COALESCE(max(sort_order),0)+10 AS n FROM content_items WHERE kind='quiz'").first();
          await sql(db, "INSERT INTO content_items(kind,id,draft,sort_order,updated_by) VALUES('quiz',?,?::jsonb,?,?)", id, JSON.stringify(draft), Number(order.n), user.id).run();
        }
      }
      return json({ dryRun: false, ok: true, errors: [], items, summary: summary2 });
    }
    fail(404, "Endpoint admin tidak ditemukan.");
  } catch (error) {
    if (!(error instanceof HttpError)) console.error("Admin API error:", error.message);
    return json({ error: error instanceof HttpError ? error.message : "Server mengalami kendala. Coba lagi." }, error.status || 500);
  }
}

// server/headers.mjs
var csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co; frame-src https://www.youtube-nocookie.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'";
var securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": csp
};

// server/schema.mjs
var ESSAY_GRADING = [
  "alter table public.quiz_attempts alter column score drop not null",
  "alter table public.quiz_attempts add column if not exists status text not null default 'graded'",
  "alter table public.quiz_attempts add column if not exists max_points integer",
  "alter table public.quiz_attempts add column if not exists earned_points numeric(8,2)",
  "alter table public.quiz_attempts add column if not exists graded_at timestamptz",
  "alter table public.quiz_attempts add column if not exists graded_by uuid references public.users (id) on delete set null",
  `do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'quiz_attempts_status_check') then
      alter table public.quiz_attempts add constraint quiz_attempts_status_check
        check ((status = 'graded' and score is not null) or (status = 'pending' and score is null));
    end if;
  end $$`,
  "create index if not exists attempt_pending_idx on public.quiz_attempts (created_at) where status = 'pending'"
];
var checked = /* @__PURE__ */ new WeakMap();
function ensureSchema(db) {
  let p = checked.get(db);
  if (!p) {
    p = (async () => {
      const has = await db.prepare("SELECT 1 AS x FROM information_schema.columns WHERE table_schema='public' AND table_name='quiz_attempts' AND column_name='status'").first();
      if (has) return false;
      await db.batch(ESSAY_GRADING.map((q) => db.prepare(q)));
      console.log("Learning Hub: migrasi essay & penilaian diterapkan otomatis.");
      return true;
    })();
    p.catch(() => checked.delete(db));
    checked.set(db, p);
  }
  return p;
}

// server/app.mjs
var bearer = (request) => {
  const value = request.headers.get("authorization") || "";
  const match = value.match(/^Bearer\s+([A-Za-z0-9._-]{20,4096})$/);
  return match ? match[1] : null;
};
async function resolveUser(db, verified) {
  let row = await sql(db, "SELECT name,email,role,status FROM users WHERE id=?", verified.id).first();
  if (!row || row.email !== verified.email || verified.hasName && row.name !== verified.name) {
    row = await sql(db, `INSERT INTO users(id,name,email,created_at) VALUES(?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET email=excluded.email${verified.hasName ? ", name=excluded.name" : ""}
      RETURNING name,email,role,status`, verified.id, verified.name, verified.email, (/* @__PURE__ */ new Date()).toISOString()).first();
  }
  return { id: verified.id, name: row.name, email: row.email, role: row.role, status: row.status };
}
function createHandler({ getDb, verifyToken, config: config2, admin }) {
  return async function handle2(request) {
    let response;
    try {
      const url = new URL(request.url), path = url.pathname;
      if (path === "/api/auth/config" && request.method === "GET") {
        response = config2.supabaseUrl && config2.supabaseKey ? json({ mode: "supabase", registration: config2.allowRegistration, supabaseUrl: config2.supabaseUrl, supabaseKey: config2.supabaseKey }) : json({ error: "Konfigurasi Supabase belum lengkap di server." }, 503);
      } else {
        const token = bearer(request);
        const verified = token ? await verifyToken(token) : null;
        if (!verified) response = json({ error: "Silakan masuk untuk melanjutkan." }, 401);
        else {
          const db = await getDb();
          await ensureSchema(db);
          const user = await resolveUser(db, verified);
          if (user.status === "disabled") response = json({ error: "Akun kamu sedang dinonaktifkan. Hubungi pengelola Learning Hub.", code: "disabled" }, 403);
          else if (path.startsWith("/api/admin/")) {
            response = user.role === "admin" ? await adminApi(request, { db, user, origin: url.origin, config: config2, admin }) : json({ error: "Halaman ini khusus admin." }, 403);
          } else response = await api(request, { db, user, origin: url.origin });
        }
      }
    } catch (error) {
      console.error("Learning Hub API error:", error?.message);
      response = json({ error: "Server mengalami kendala. Coba lagi." }, 500);
    }
    for (const [k, v] of Object.entries(securityHeaders)) response.headers.set(k, v);
    return response;
  };
}

// server/db.mjs
var toPg = (query) => {
  let n = 0;
  return query.replace(/\?/g, () => `$${++n}`);
};
function createDb(executor) {
  const statement = (query, args = []) => ({
    query,
    args,
    bind: (...values2) => statement(query, values2),
    async all() {
      return { results: await executor.query(toPg(query), args), success: true };
    },
    async first() {
      return (await executor.query(toPg(query), args))[0] || null;
    },
    async run() {
      await executor.query(toPg(query), args);
      return { results: [], success: true };
    }
  });
  return {
    prepare: (query) => statement(query),
    async batch(statements) {
      return executor.transaction(async (query) => {
        const out = [];
        for (const s of statements) out.push({ results: await query(toPg(s.query), s.args), success: true });
        return out;
      });
    }
  };
}
var pooled;
async function productionDb() {
  if (pooled) return pooled;
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum diatur.");
  const { default: postgres2 } = await Promise.resolve().then(() => (init_src(), src_exports));
  const url = process.env.DATABASE_URL, local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const sql2 = postgres2(url, { prepare: false, max: Number(process.env.DB_POOL_MAX) || 3, idle_timeout: 20, connect_timeout: 10, ssl: local ? false : "require" });
  pooled = createDb({
    query: (text, params) => sql2.unsafe(text, params),
    transaction: (fn) => sql2.begin((tx) => fn((text, params) => tx.unsafe(text, params)))
  });
  return pooled;
}

// server/auth.mjs
var import_auth_js = __toESM(require_main(), 1);
function supabaseConfig(env = process.env) {
  return {
    supabaseUrl: (env.SUPABASE_URL || "").replace(/\/$/, ""),
    supabaseKey: env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || "",
    allowRegistration: env.ALLOW_REGISTRATION === "true",
    // Server-only. Dipakai untuk undang/nonaktifkan peserta & unggah gambar. Tidak pernah dikirim ke browser.
    secretKey: env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || ""
  };
}
function profileFromClaims(claims) {
  if (!claims?.sub || claims.role !== "authenticated" || claims.is_anonymous) return null;
  const email = typeof claims.email === "string" ? claims.email : "";
  const meta = claims.user_metadata || {};
  const raw = typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : "";
  const name = raw.trim().slice(0, 80) || email.split("@")[0] || "Learner";
  return { id: claims.sub, name, email, hasName: Boolean(raw.trim()) };
}
function supabaseVerifier({ supabaseUrl, supabaseKey }) {
  let client;
  return async (token) => {
    if (!supabaseUrl || !supabaseKey) throw new Error("SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY belum diatur.");
    client ||= new import_auth_js.AuthClient({ url: `${supabaseUrl}/auth/v1`, headers: { apikey: supabaseKey }, persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
    const { data, error } = await client.getClaims(token);
    if (error || !data?.claims) return null;
    return profileFromClaims(data.claims);
  };
}

// server/supabase-admin.mjs
var import_auth_js2 = __toESM(require_main(), 1);
function supabaseAdmin({ supabaseUrl, secretKey }) {
  const need = () => {
    if (!supabaseUrl || !secretKey) throw new HttpError(503, "SUPABASE_SECRET_KEY belum diatur di Vercel. Fitur ini butuh secret key.");
  };
  const headers = () => ({ apikey: secretKey, Authorization: `Bearer ${secretKey}` });
  let auth;
  const admin = () => {
    need();
    auth ||= new import_auth_js2.AuthClient({ url: `${supabaseUrl}/auth/v1`, headers: headers(), persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
    return auth.admin;
  };
  return {
    async invite(email, { name, redirectTo }) {
      const { data, error } = await admin().inviteUserByEmail(email, { data: { full_name: name }, redirectTo });
      if (error) {
        if (/already been registered|already registered|email_exists/i.test(error.message + (error.code || ""))) throw new HttpError(409, "Email ini sudah terdaftar.");
        if (/rate limit/i.test(error.message)) throw new HttpError(429, "Batas pengiriman email tercapai. Coba lagi nanti atau naikkan batas di Supabase \u2192 Authentication \u2192 Rate Limits.");
        console.error("Invite error:", error.message);
        throw new HttpError(502, "Undangan gagal dikirim. Cek pengaturan SMTP di Supabase (Authentication \u2192 Logs).");
      }
      return { id: data.user.id };
    },
    async setBanned(id, banned) {
      const { error } = await admin().updateUserById(id, { ban_duration: banned ? "876000h" : "none" });
      if (error) {
        console.error("Ban error:", error.message);
        throw new HttpError(502, "Status akun gagal diubah di Supabase Auth.");
      }
    },
    async signUpload(path) {
      need();
      const response = await fetch(`${supabaseUrl}/storage/v1/object/upload/sign/${MEDIA_BUCKET}/${path}`, { method: "POST", headers: { ...headers(), "Content-Type": "application/json" }, body: "{}" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.url !== "string") {
        console.error("Signed upload error:", response.status, data?.message);
        throw new HttpError(502, "Gagal menyiapkan unggahan. Pastikan migrasi 2 (bucket lms-media) sudah dijalankan.");
      }
      return { uploadUrl: `${supabaseUrl}/storage/v1${data.url}` };
    }
  };
}

// server/vercel-entry.mjs
var config = supabaseConfig();
var handle = createHandler({ getDb: productionDb, verifyToken: supabaseVerifier(config), config, admin: supabaseAdmin(config) });
function publicRequest(request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const proto = (request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "")).split(",")[0].trim();
  const original = url.searchParams.get("__path");
  url.searchParams.delete("__path");
  const pathname = original !== null ? `/api/${original}` : url.pathname;
  const fixed = new URL(`${proto}://${host}${pathname}${url.search}`);
  const hasBody = !["GET", "HEAD"].includes(request.method);
  return new Request(fixed, { method: request.method, headers: request.headers, ...hasBody ? { body: request.body, duplex: "half" } : {} });
}
var entry = (request) => handle(publicRequest(request));
var GET = entry;
var POST = entry;
export {
  GET,
  POST
};
