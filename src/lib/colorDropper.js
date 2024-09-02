import { $ } from './utils';

const dropperPreview = $('color-dropper');

/* eslint-disable import/prefer-default-export */
export const openColorDropper = ({ type, canvas }) => {
  if (!dropperPreview) return;
  const _ctx = canvas.canvas;
};
