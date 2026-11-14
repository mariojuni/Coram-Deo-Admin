import React from 'react';
import logo1024 from '../../../assets/app-logo.png';
import logo128 from '../../../assets/app-logo-128.png';
import logo64 from '../../../assets/app-logo-64.png';

/**
 * CathedralLogo — Authentic High-Definition CoramDeo Brand Mark.
 * Renders the official 1024x1024 HD logo ported from CoramDeo Mobile Flutter
 * using multi-density Lanczos downsampled assets for razor-sharp Retina/4K display.
 */
export default function CathedralLogo({ size = 36, className = '', alt = 'CoramDeo Logo' }) {
  return (
    <img
      src={logo128}
      srcSet={`${logo64} 1x, ${logo128} 2x, ${logo1024} 3x`}
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 select-none object-contain rounded-xl ${className}`}
      loading="eager"
      decoding="async"
      style={{ imageRendering: '-webkit-optimize-contrast' }}
    />
  );
}
