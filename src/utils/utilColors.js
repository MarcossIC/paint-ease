// Portions of this file are adapted from:
// Copyright (c) 2018 Dan Burzo - MIT License
// See LICENSE for full details.
import { Tok, hsl_old, rgb_num_old, rgb_per_old, hex, k, e, D50, named, β, α } from './constants.js';


export const normalizeHue = hue => ((hue = hue % 360) < 0 ? hue + 360 : hue);
export const lerp = (a, b, t) => a + t * (b - a);

export const hueToDeg = (val, unit) => {
	switch (unit) {
		case 'deg':
			return +val;
		case 'rad':
			return (val / Math.PI) * 180;
		case 'grad':
			return (val / 10) * 9;
		case 'turn':
			return val * 360;
	}
};

export const linearize = (v = 0) => {
	let abs = Math.abs(v);
	if (abs < β * 4.5) {
		return v / 4.5;
	}
	return (Math.sign(v) || 1) * Math.pow((abs + α - 1) / α, 1 / 0.45);
};

const gamma = v => {
	const abs = Math.abs(v);
	if (abs > β) {
		return (Math.sign(v) || 1) * (α * Math.pow(abs, 0.45) - (α - 1));
	}
	return 4.5 * v;
};

export const averageAngle = val => {
	let sum = val.reduce(
		(sum, val) => {
			if (val !== undefined) {
				let rad = (val * Math.PI) / 180;
				sum.sin += Math.sin(rad);
				sum.cos += Math.cos(rad);
			}
			return sum;
		},
		{ sin: 0, cos: 0 }
	);
	let angle = (Math.atan2(sum.sin, sum.cos) * 180) / Math.PI;
	return angle < 0 ? 360 + angle : angle;
};

export const fnToRGB = (c = 0) => {
	const abs = Math.abs(c);
	if (abs > 0.0031308) {
		return (Math.sign(c) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
	}
	return c * 12.92;
};
export const fnToLRGB = (c = 0) => {
	const abs = Math.abs(c);
	if (abs <= 0.04045) {
		return c / 12.92;
	}
	return (Math.sign(c) || 1) * Math.pow((abs + 0.055) / 1.055, 2.4);
};

export const fnToXYZ50 = v => (Math.pow(v, 3) > e ? Math.pow(v, 3) : (116 * v - 16) / k);
export const fnToLab = value => (value > e ? Math.cbrt(value) : (k * value + 16) / 116);

export const fixupAlpha = arr => {
	let some_defined = false;
	let res = arr.map(v => {
		if (v !== undefined) {
			some_defined = true;
			return v;
		}
		return 1;
	});
	return some_defined ? res : arr;
};

export const get_classes = arr => {
	let classes = [];
	for (let i = 0; i < arr.length - 1; i++) {
		let a = arr[i];
		let b = arr[i + 1];
		if (a === undefined && b === undefined) {
			classes.push(undefined);
		} else if (a !== undefined && b !== undefined) {
			classes.push([a, b]);
		} else {
			classes.push(a !== undefined ? [a, a] : [b, b]);
		}
	}
	return classes;
};

export const interpolatorPiecewise = interpolator => arr => {
	let classes = get_classes(arr);
	return t => {
		let cls = t * classes.length;
		let idx = t >= 1 ? classes.length - 1 : Math.max(Math.floor(cls), 0);
		let pair = classes[idx];
		return pair === undefined
			? undefined
			: interpolator(pair[0], pair[1], cls - idx);
	};
};

export const hue = (hues, fn) => {
	return hues
		.map((hue, idx, arr) => {
			if (hue === undefined) {
				return hue;
			}
			let normalized = normalizeHue(hue);
			if (idx === 0 || hues[idx - 1] === undefined) {
				return normalized;
			}
			return fn(normalized - normalizeHue(arr[idx - 1]));
		})
		.reduce((acc, curr) => {
			if (
				!acc.length ||
				curr === undefined ||
				acc[acc.length - 1] === undefined
			) {
				acc.push(curr);
				return acc;
			}
			acc.push(curr + acc[acc.length - 1]);
			return acc;
		}, []);
};

export const fixupHueShorter = arr =>
	hue(arr, d => (Math.abs(d) <= 180 ? d : d - 360 * Math.sign(d)));
export const fixupHueLonger = arr =>
	hue(arr, d => (Math.abs(d) >= 180 || d === 0 ? d : d - 360 * Math.sign(d)));


export const interpolatorLinear = interpolatorPiecewise(lerp);

export const differenceHueSaturation = (std, smp) => {
	if (std.h === undefined || smp.h === undefined || !std.s || !smp.s) {
		return 0;
	}
	let std_h = normalizeHue(std.h);
	let smp_h = normalizeHue(smp.h);
	let dH = Math.sin((((smp_h - std_h + 360) / 2) * Math.PI) / 180);
	return 2 * Math.sqrt(std.s * smp.s) * dH;
};

const differenceHueChroma = (std, smp) => {
	if (std.h === undefined || smp.h === undefined || !std.c || !smp.c) {
		return 0;
	}
	let std_h = normalizeHue(std.h);
	let smp_h = normalizeHue(smp.h);
	let dH = Math.sin((((smp_h - std_h + 360) / 2) * Math.PI) / 180);
	return 2 * Math.sqrt(std.c * smp.c) * dH;
};

export const parseNumber = (color, len) => {
	if (typeof color !== 'number') return;

	// hex3: #c93 -> #cc9933
	if (len === 3) {
		return {
			mode: 'rgb',
			r: (((color >> 8) & 0xf) | ((color >> 4) & 0xf0)) / 255,
			g: (((color >> 4) & 0xf) | (color & 0xf0)) / 255,
			b: ((color & 0xf) | ((color << 4) & 0xf0)) / 255
		};
	}

	// hex4: #c931 -> #cc993311
	if (len === 4) {
		return {
			mode: 'rgb',
			r: (((color >> 12) & 0xf) | ((color >> 8) & 0xf0)) / 255,
			g: (((color >> 8) & 0xf) | ((color >> 4) & 0xf0)) / 255,
			b: (((color >> 4) & 0xf) | (color & 0xf0)) / 255,
			alpha: ((color & 0xf) | ((color << 4) & 0xf0)) / 255
		};
	}

	// hex6: #f0f1f2
	if (len === 6) {
		return {
			mode: 'rgb',
			r: ((color >> 16) & 0xff) / 255,
			g: ((color >> 8) & 0xff) / 255,
			b: (color & 0xff) / 255
		};
	}

	// hex8: #f0f1f2ff
	if (len === 8) {
		return {
			mode: 'rgb',
			r: ((color >> 24) & 0xff) / 255,
			g: ((color >> 16) & 0xff) / 255,
			b: ((color >> 8) & 0xff) / 255,
			alpha: (color & 0xff) / 255
		};
	}
};

const parseTransparent = c =>
	c === 'transparent'
		? { mode: 'rgb', r: 0, g: 0, b: 0, alpha: 0 }
		: undefined;

export const parseNamed = color => {
	return parseNumber(named[color.toLowerCase()], 6);
};

export const parseHex = color => {
	let match;
	// eslint-disable-next-line no-cond-assign
	return (match = color.match(hex))
		? parseNumber(parseInt(match[1], 16), match[1].length)
		: undefined;
};

function parseRgb(color, parsed) {
	if (!parsed || (parsed[0] !== 'rgb' && parsed[0] !== 'rgba')) {
		return undefined;
	}
	const res = { mode: 'rgb' };
	const [, r, g, b, alpha] = parsed;
	if (r.type === Tok.Hue || g.type === Tok.Hue || b.type === Tok.Hue) {
		return undefined;
	}
	if (r.type !== Tok.None) {
		res.r = r.type === Tok.Number ? r.value / 255 : r.value / 100;
	}
	if (g.type !== Tok.None) {
		res.g = g.type === Tok.Number ? g.value / 255 : g.value / 100;
	}
	if (b.type !== Tok.None) {
		res.b = b.type === Tok.Number ? b.value / 255 : b.value / 100;
	}
	if (alpha.type !== Tok.None) {
		res.alpha = Math.min(
			1,
			Math.max(
				0,
				alpha.type === Tok.Number ? alpha.value : alpha.value / 100
			)
		);
	}

	return res;
}

function parseLch(color, parsed) {
	if (!parsed || parsed[0] !== 'lch') {
		return undefined;
	}
	const res = { mode: 'lch' };
	const [, l, c, h, alpha] = parsed;
	if (l.type !== Tok.None) {
		if (l.type === Tok.Hue) {
			return undefined;
		}
		res.l = Math.min(Math.max(0, l.value), 100);
	}
	if (c.type !== Tok.None) {
		res.c = Math.max(
			0,
			c.type === Tok.Number ? c.value : (c.value * 150) / 100
		);
	}
	if (h.type !== Tok.None) {
		if (h.type === Tok.Percentage) {
			return undefined;
		}
		res.h = h.value;
	}
	if (alpha.type !== Tok.None) {
		res.alpha = Math.min(
			1,
			Math.max(
				0,
				alpha.type === Tok.Number ? alpha.value : alpha.value / 100
			)
		);
	}

	return res;
}

function parseOklch(color, parsed) {
	if (!parsed || parsed[0] !== 'oklch') {
		return undefined;
	}
	const res = { mode: 'oklch' };
	const [, l, c, h, alpha] = parsed;
	if (l.type !== Tok.None) {
		if (l.type === Tok.Hue) {
			return undefined;
		}
		res.l = Math.min(
			Math.max(0, l.type === Tok.Number ? l.value : l.value / 100),
			1
		);
	}
	if (c.type !== Tok.None) {
		res.c = Math.max(
			0,
			c.type === Tok.Number ? c.value : (c.value * 0.4) / 100
		);
	}
	if (h.type !== Tok.None) {
		if (h.type === Tok.Percentage) {
			return undefined;
		}
		res.h = h.value;
	}
	if (alpha.type !== Tok.None) {
		res.alpha = Math.min(
			1,
			Math.max(
				0,
				alpha.type === Tok.Number ? alpha.value : alpha.value / 100
			)
		);
	}

	return res;
}

export const parseRgbLegacy = color => {
	let res = { mode: 'rgb' };
	let match;
	if ((match = color.match(rgb_num_old))) {
		if (match[1] !== undefined) {
			res.r = match[1] / 255;
		}
		if (match[2] !== undefined) {
			res.g = match[2] / 255;
		}
		if (match[3] !== undefined) {
			res.b = match[3] / 255;
		}
	} else if ((match = color.match(rgb_per_old))) {
		if (match[1] !== undefined) {
			res.r = match[1] / 100;
		}
		if (match[2] !== undefined) {
			res.g = match[2] / 100;
		}
		if (match[3] !== undefined) {
			res.b = match[3] / 100;
		}
	} else {
		return undefined;
	}

	if (match[4] !== undefined) {
		res.alpha = Math.max(0, Math.min(1, match[4] / 100));
	} else if (match[5] !== undefined) {
		res.alpha = Math.max(0, Math.min(1, +match[5]));
	}

	return res;
};

export function parseHsl(color, parsed) {
	if (!parsed || (parsed[0] !== 'hsl' && parsed[0] !== 'hsla')) {
		return undefined;
	}
	const res = { mode: 'hsl' };
	const [, h, s, l, alpha] = parsed;

	if (h.type !== Tok.None) {
		if (h.type === Tok.Percentage) {
			return undefined;
		}
		res.h = h.value;
	}

	if (s.type !== Tok.None) {
		if (s.type === Tok.Hue) {
			return undefined;
		}
		res.s = s.value / 100;
	}

	if (l.type !== Tok.None) {
		if (l.type === Tok.Hue) {
			return undefined;
		}
		res.l = l.value / 100;
	}

	if (alpha.type !== Tok.None) {
		res.alpha = Math.min(
			1,
			Math.max(
				0,
				alpha.type === Tok.Number ? alpha.value : alpha.value / 100
			)
		);
	}

	return res;
}

export const parseHslLegacy = color => {
	let match = color.match(hsl_old);
	if (!match) return;
	let res = { mode: 'hsl' };

	if (match[3] !== undefined) {
		res.h = +match[3];
	} else if (match[1] !== undefined && match[2] !== undefined) {
		res.h = hueToDeg(match[1], match[2]);
	}

	if (match[4] !== undefined) {
		res.s = Math.min(Math.max(0, match[4] / 100), 1);
	}

	if (match[5] !== undefined) {
		res.l = Math.min(Math.max(0, match[5] / 100), 1);
	}

	if (match[6] !== undefined) {
		res.alpha = Math.max(0, Math.min(1, match[6] / 100));
	} else if (match[7] !== undefined) {
		res.alpha = Math.max(0, Math.min(1, +match[7]));
	}
	return res;
};
const convertLrgbToOklab = ({ r, g, b, alpha }) => {
	if (r === undefined) r = 0;
	if (g === undefined) g = 0;
	if (b === undefined) b = 0;

	let L = Math.cbrt(
		0.412221469470763 * r + 0.5363325372617348 * g + 0.0514459932675022 * b
	);
	let M = Math.cbrt(
		0.2119034958178252 * r + 0.6806995506452344 * g + 0.1073969535369406 * b
	);
	let S = Math.cbrt(
		0.0883024591900564 * r + 0.2817188391361215 * g + 0.6299787016738222 * b
	);

	let res = {
		mode: 'oklab',
		l:
			0.210454268309314 * L +
			0.7936177747023054 * M -
			0.0040720430116193 * S,
		a:
			1.9779985324311684 * L -
			2.4285922420485799 * M +
			0.450593709617411 * S,
		b:
			0.0259040424655478 * L +
			0.7827717124575296 * M -
			0.8086757549230774 * S
	};

	if (alpha !== undefined) {
		res.alpha = alpha;
	}

	return res;
};

export const convertOklabToLrgb = ({ l, a, b, alpha }) => {
	if (l === undefined) l = 0;
	if (a === undefined) a = 0;
	if (b === undefined) b = 0;

	let L = Math.pow(l + 0.3963377773761749 * a + 0.2158037573099136 * b, 3);
	let M = Math.pow(l - 0.1055613458156586 * a - 0.0638541728258133 * b, 3);
	let S = Math.pow(l - 0.0894841775298119 * a - 1.2914855480194092 * b, 3);

	let res = {
		mode: 'lrgb',
		r:
			4.0767416360759574 * L -
			3.3077115392580616 * M +
			0.2309699031821044 * S,
		g:
			-1.2684379732850317 * L +
			2.6097573492876887 * M -
			0.3413193760026573 * S,
		b:
			-0.0041960761386756 * L -
			0.7034186179359362 * M +
			1.7076146940746117 * S
	};

	if (alpha !== undefined) {
		res.alpha = alpha;
	}

	return res;
};

export const convertLchToLab = ({ l, c, h, alpha }, mode = 'lab') => {
	if (h === undefined) h = 0;
	let res = {
		mode,
		l,
		a: c ? c * Math.cos((h / 180) * Math.PI) : 0,
		b: c ? c * Math.sin((h / 180) * Math.PI) : 0
	};
	if (alpha !== undefined) res.alpha = alpha;
	return res;
};

export function convertRgbToHsl({ r, g, b, alpha }) {
	if (r === undefined) r = 0;
	if (g === undefined) g = 0;
	if (b === undefined) b = 0;
	let M = Math.max(r, g, b),
		m = Math.min(r, g, b);
	let res = {
		mode: 'hsl',
		s: M === m ? 0 : (M - m) / (1 - Math.abs(M + m - 1)),
		l: 0.5 * (M + m)
	};
	if (M - m !== 0)
		res.h =
			(M === r
				? (g - b) / (M - m) + (g < b) * 6
				: M === g
				? (b - r) / (M - m) + 2
				: (r - g) / (M - m) + 4) * 60;
	if (alpha !== undefined) res.alpha = alpha;
	return res;
}

export const convertLabToLch = ({ l, a, b, alpha }, mode = 'lch') => {
	if (a === undefined) a = 0;
	if (b === undefined) b = 0;
	let c = Math.sqrt(a * a + b * b);
	let res = { mode, l, c };
	if (c) res.h = normalizeHue((Math.atan2(b, a) * 180) / Math.PI);
	if (alpha !== undefined) res.alpha = alpha;
	return res;
};

export const convertLrgbToRgb = ({ r, g, b, alpha }, mode = 'rgb') => {
	let res = {
		mode,
		r: fnToRGB(r),
		g: fnToRGB(g),
		b: fnToRGB(b)
	};
	if (alpha !== undefined) res.alpha = alpha;
	return res;
};

export const convertRgbToLrgb = ({ r, g, b, alpha }) => {
	let res = {
		mode: 'lrgb',
		r: fnToLRGB(r),
		g: fnToLRGB(g),
		b: fnToLRGB(b)
	};
	if (alpha !== undefined) res.alpha = alpha;
	return res;
};



export const convertP3ToXyz65 = rgb => {
	let { r, g, b, alpha } = convertRgbToLrgb(rgb);
	let res = {
		mode: 'xyz65',
		x:
			0.486570948648216 * r +
			0.265667693169093 * g +
			0.1982172852343625 * b,
		y:
			0.2289745640697487 * r +
			0.6917385218365062 * g +
			0.079286914093745 * b,
		z: 0.0 * r + 0.0451133818589026 * g + 1.043944368900976 * b
	};
	if (alpha !== undefined) {
		res.alpha = alpha;
	}
	return res;
};

export const convertXyz65ToP3 = ({ x, y, z, alpha }) => {
	if (x === undefined) x = 0;
	if (y === undefined) y = 0;
	if (z === undefined) z = 0;
	let res = convertLrgbToRgb(
		{
			r:
				x * 2.4934969119414263 -
				y * 0.9313836179191242 -
				0.402710784450717 * z,
			g:
				x * -0.8294889695615749 +
				y * 1.7626640603183465 +
				0.0236246858419436 * z,
			b:
				x * 0.0358458302437845 -
				y * 0.0761723892680418 +
				0.9568845240076871 * z
		},
		'p3'
	);
	if (alpha !== undefined) {
		res.alpha = alpha;
	}
	return res;
};

const convertRgbToXyz65 = rgb => {
	let { r, g, b, alpha } = convertRgbToLrgb(rgb);
	let res = {
		mode: 'xyz65',
		x:
			0.4123907992659593 * r +
			0.357584339383878 * g +
			0.1804807884018343 * b,
		y:
			0.2126390058715102 * r +
			0.715168678767756 * g +
			0.0721923153607337 * b,
		z:
			0.0193308187155918 * r +
			0.119194779794626 * g +
			0.9505321522496607 * b
	};
	if (alpha !== undefined) {
		res.alpha = alpha;
	}
	return res;
};

const convertXyz65ToRgb = ({ x, y, z, alpha }) => {
	if (x === undefined) x = 0;
	if (y === undefined) y = 0;
	if (z === undefined) z = 0;
	let res = convertLrgbToRgb({
		r:
			x * 3.2409699419045226 -
			y * 1.5373831775700939 -
			0.4986107602930034 * z,
		g:
			x * -0.9692436362808796 +
			y * 1.8759675015077204 +
			0.0415550574071756 * z,
		b:
			x * 0.0556300796969936 -
			y * 0.2039769588889765 +
			1.0569715142428784 * z
	});
	if (alpha !== undefined) {
		res.alpha = alpha;
	}
	return res;
};

export function convertHslToRgb({ h, s, l, alpha }) {
	h = normalizeHue(h !== undefined ? h : 0);
	if (s === undefined) s = 0;
	if (l === undefined) l = 0;
	let m1 = l + s * (l < 0.5 ? l : 1 - l);
	let m2 = m1 - (m1 - l) * 2 * Math.abs(((h / 60) % 2) - 1);
	let res;
	switch (Math.floor(h / 60)) {
		case 0:
			res = { r: m1, g: m2, b: 2 * l - m1 };
			break;
		case 1:
			res = { r: m2, g: m1, b: 2 * l - m1 };
			break;
		case 2:
			res = { r: 2 * l - m1, g: m1, b: m2 };
			break;
		case 3:
			res = { r: 2 * l - m1, g: m2, b: m1 };
			break;
		case 4:
			res = { r: m2, g: 2 * l - m1, b: m1 };
			break;
		case 5:
			res = { r: m1, g: 2 * l - m1, b: m2 };
			break;
		default:
			res = { r: 2 * l - m1, g: 2 * l - m1, b: 2 * l - m1 };
	}
	res.mode = 'rgb';
	if (alpha !== undefined) res.alpha = alpha;
	return res;
}

const convertXyz50ToRgb = ({ x, y, z, alpha }) => {
	if (x === undefined) x = 0;
	if (y === undefined) y = 0;
	if (z === undefined) z = 0;
	let res = convertLrgbToRgb({
		r:
			x * 3.1341359569958707 -
			y * 1.6173863321612538 -
			0.4906619460083532 * z,
		g:
			x * -0.978795502912089 +
			y * 1.916254567259524 +
			0.03344273116131949 * z,
		b:
			x * 0.07195537988411677 -
			y * 0.2289768264158322 +
			1.405386058324125 * z
	});
	if (alpha !== undefined) {
		res.alpha = alpha;
	}
	return res;
};

const convertRec2020ToXyz65 = rec2020 => {
	let r = linearize(rec2020.r);
	let g = linearize(rec2020.g);
	let b = linearize(rec2020.b);
	let res = {
		mode: 'xyz65',
		x:
			0.6369580483012911 * r +
			0.1446169035862083 * g +
			0.1688809751641721 * b,
		y:
			0.262700212011267 * r +
			0.6779980715188708 * g +
			0.059301716469862 * b,
		z: 0 * r + 0.0280726930490874 * g + 1.0609850577107909 * b
	};
	if (rec2020.alpha !== undefined) {
		res.alpha = rec2020.alpha;
	}
	return res;
};

const convertXyz65ToRec2020 = ({ x, y, z, alpha }) => {
	if (x === undefined) x = 0;
	if (y === undefined) y = 0;
	if (z === undefined) z = 0;
	let res = {
		mode: 'rec2020',
		r: gamma(
			x * 1.7166511879712683 -
				y * 0.3556707837763925 -
				0.2533662813736599 * z
		),
		g: gamma(
			x * -0.6666843518324893 +
				y * 1.6164812366349395 +
				0.0157685458139111 * z
		),
		b: gamma(
			x * 0.0176398574453108 -
				y * 0.0427706132578085 +
				0.9421031212354739 * z
		)
	};
	if (alpha !== undefined) {
		res.alpha = alpha;
	}
	return res;
};

export const convertLabToXyz50 = ({ l, a, b, alpha }) => {
	if (l === undefined) l = 0;
	if (a === undefined) a = 0;
	if (b === undefined) b = 0;
	let fy = (l + 16) / 116;
	let fx = a / 500 + fy;
	let fz = fy - b / 200;

	let res = {
		mode: 'xyz50',
		x: fnToXYZ50(fx) * D50.X,
		y: fnToXYZ50(fy) * D50.Y,
		z: fnToXYZ50(fz) * D50.Z
	};

	if (alpha !== undefined) {
		res.alpha = alpha;
	}

	return res;
};

export const convertXyz50ToLab = ({ x, y, z, alpha }) => {
	if (x === undefined) x = 0;
	if (y === undefined) y = 0;
	if (z === undefined) z = 0;
	let f0 = fnToLab(x / D50.X);
	let f1 = fnToLab(y / D50.Y);
	let f2 = fnToLab(z / D50.Z);

	let res = {
		mode: 'lab',
		l: 116 * f1 - 16,
		a: 500 * (f0 - f1),
		b: 200 * (f1 - f2)
	};

	if (alpha !== undefined) {
		res.alpha = alpha;
	}

	return res;
};

const convertRgbToXyz50 = rgb => {
	let { r, g, b, alpha } = convertRgbToLrgb(rgb);
	let res = {
		mode: 'xyz50',
		x:
			0.436065742824811 * r +
			0.3851514688337912 * g +
			0.14307845442264197 * b,
		y:
			0.22249319175623702 * r +
			0.7168870538238823 * g +
			0.06061979053616537 * b,
		z:
			0.013923904500943465 * r +
			0.09708128566574634 * g +
			0.7140993584005155 * b
	};
	if (alpha !== undefined) {
		res.alpha = alpha;
	}
	return res;
};

export const convertRgbToLab = rgb => {
	let res = convertXyz50ToLab(convertRgbToXyz50(rgb));

	// Fixes achromatic RGB colors having a _slight_ chroma due to floating-point errors
	// and approximated computations in sRGB <-> CIELab.
	if (rgb.r === rgb.b && rgb.b === rgb.g) {
		res.a = res.b = 0;
	}
	return res;
};

export const convertLabToRgb = lab => convertXyz50ToRgb(convertLabToXyz50(lab));
export const convertOklabToRgb = c => convertLrgbToRgb(convertOklabToLrgb(c));
export const convertRgbToOklab = rgb => {
	let res = convertLrgbToOklab(convertRgbToLrgb(rgb));
	if (rgb.r === rgb.b && rgb.b === rgb.g) {
		res.a = res.b = 0;
	}
	return res;
};

export const modeRgb = {
	mode: 'rgb',
	channels: ['r', 'g', 'b', 'alpha'],
	parse: [
		parseRgb,
		parseHex,
		parseRgbLegacy,
		parseNamed,
		parseTransparent,
		'srgb'
	],
	serialize: 'srgb',
	interpolate: {
		r: interpolatorLinear,
		g: interpolatorLinear,
		b: interpolatorLinear,
		alpha: { use: interpolatorLinear, fixup: fixupAlpha }
	},
	gamut: true,
	white: { r: 1, g: 1, b: 1 },
	black: { r: 0, g: 0, b: 0 }
};

export const modeHsl = {
	mode: 'hsl',

	toMode: {
		rgb: convertHslToRgb
	},

	fromMode: {
		rgb: convertRgbToHsl
	},

	channels: ['h', 's', 'l', 'alpha'],

	ranges: {
		h: [0, 360]
	},

	gamut: 'rgb',

	parse: [parseHsl, parseHslLegacy],
	serialize: c =>
		`hsl(${c.h !== undefined ? c.h : 'none'} ${
			c.s !== undefined ? c.s * 100 + '%' : 'none'
		} ${c.l !== undefined ? c.l * 100 + '%' : 'none'}${
			c.alpha < 1 ? ` / ${c.alpha}` : ''
		})`,

	interpolate: {
		h: { use: interpolatorLinear, fixup: fixupHueShorter },
		s: interpolatorLinear,
		l: interpolatorLinear,
		alpha: { use: interpolatorLinear, fixup: fixupAlpha }
	},

	difference: {
		h: differenceHueSaturation
	},

	average: {
		h: averageAngle
	}
};

export const modeLch = {
	mode: 'lch',

	toMode: {
		lab: convertLchToLab,
		rgb: c => convertLabToRgb(convertLchToLab(c))
	},

	fromMode: {
		rgb: c => convertLabToLch(convertRgbToLab(c)),
		lab: convertLabToLch
	},

	channels: ['l', 'c', 'h', 'alpha'],

	ranges: {
		l: [0, 100],
		c: [0, 150],
		h: [0, 360]
	},

	parse: [parseLch],
	serialize: c =>
		`lch(${c.l !== undefined ? c.l : 'none'} ${
			c.c !== undefined ? c.c : 'none'
		} ${c.h !== undefined ? c.h : 'none'}${
			c.alpha < 1 ? ` / ${c.alpha}` : ''
		})`,

	interpolate: {
		h: { use: interpolatorLinear, fixup: fixupHueShorter },
		c: interpolatorLinear,
		l: interpolatorLinear,
		alpha: { use: interpolatorLinear, fixup: fixupAlpha }
	},

	difference: {
		h: differenceHueChroma
	},

	average: {
		h: averageAngle
	}
};

export const modeP3 = {
	...modeRgb,
	mode: 'p3',
	parse: ['display-p3'],
	serialize: 'display-p3',
	fromMode: {
		rgb: color => convertXyz65ToP3(convertRgbToXyz65(color)),
		xyz65: convertXyz65ToP3
	},

	toMode: {
		rgb: color => convertXyz65ToRgb(convertP3ToXyz65(color)),
		xyz65: convertP3ToXyz65
	}
};

export const modeLrgb = {
	...modeRgb,
	mode: 'lrgb',

	toMode: {
		rgb: convertLrgbToRgb
	},

	fromMode: {
		rgb: convertRgbToLrgb
	},

	parse: ['srgb-linear'],
	serialize: 'srgb-linear'
};

export const modeRec2020 = {
	...modeRgb,
	mode: 'rec2020',

	fromMode: {
		xyz65: convertXyz65ToRec2020,
		rgb: color => convertXyz65ToRec2020(convertRgbToXyz65(color))
	},

	toMode: {
		xyz65: convertRec2020ToXyz65,
		rgb: color => convertXyz65ToRgb(convertRec2020ToXyz65(color))
	},

	parse: ['rec2020'],
	serialize: 'rec2020'
};

export const modeOklch = {
	...modeLch,
	mode: 'oklch',

	toMode: {
		oklab: c => convertLchToLab(c, 'oklab'),
		rgb: c => convertOklabToRgb(convertLchToLab(c, 'oklab'))
	},

	fromMode: {
		rgb: c => convertLabToLch(convertRgbToOklab(c), 'oklch'),
		oklab: c => convertLabToLch(c, 'oklch')
	},

	parse: [parseOklch],
	serialize: c =>
		`oklch(${c.l !== undefined ? c.l : 'none'} ${
			c.c !== undefined ? c.c : 'none'
		} ${c.h !== undefined ? c.h : 'none'}${
			c.alpha < 1 ? ` / ${c.alpha}` : ''
		})`,

	ranges: {
		l: [0, 1],
		c: [0, 0.4],
		h: [0, 360]
	}
};