'use client';

import React, { useEffect, useRef } from 'react';
import { NeatGradient as NeatGradientLib, type NeatConfig } from '@firecms/neat';

export const DEFAULT_NEAT_CONFIG: NeatConfig & Record<string, unknown> = {
    colors: [
        {
            color: '#080808',
            enabled: true,
        },
        {
            color: '#080808',
            enabled: true,
        },
        {
            color: '#0C2255',
            enabled: true,
        },
        {
            color: '#1247BB',
            enabled: true,
        },
        {
            color: '#4380FF',
            enabled: true,
        },
        {
            color: '#A6C7FF',
            enabled: true,
        },
    ],
    speed: 4,
    horizontalPressure: 4,
    verticalPressure: 3,
    waveFrequencyX: 0,
    waveFrequencyY: 0,
    waveAmplitude: 0,
    secondaryWaveEnabled: false,
    secondaryWaveFrequencyX: 3,
    secondaryWaveFrequencyY: 3,
    secondaryWaveAmplitude: 5,
    secondaryWaveSpeed: 0.6,
    secondaryWaveAngle: 1,
    shadows: 2,
    highlights: 7,
    colorBrightness: 1,
    colorSaturation: 8,
    wireframe: false,
    antialias: false,
    colorBlending: 5,
    backgroundColor: '#FF0000',
    backgroundAlpha: 1,
    grainScale: 0,
    grainSparsity: 0,
    grainIntensity: 0,
    grainSpeed: 0,
    resolution: 0.5,
    yOffset: 1059,
    yOffsetWaveMultiplier: 1.5,
    yOffsetColorMultiplier: 1.8,
    yOffsetFlowMultiplier: 2,
    flowDistortionA: 0.5126418056211617,
    flowDistortionB: 3.5115422591605348,
    flowScale: 1.576471923411623,
    flowEase: 0.21462982601001568,
    flowEnabled: false,
    enableProceduralTexture: false,
    transparentTextureVoid: false,
    textureMode: 'bitmap',
    bakeEdgeSoftness: 1,
    textureVoidLikelihood: 0.22158271334009697,
    textureVoidWidthMin: 98.70247771257357,
    textureVoidWidthMax: 378.2024266166359,
    textureBandDensity: 2.182004597904014,
    textureColorBlending: 0.04125337618420408,
    textureSeed: 8011,
    textureEase: 0.75,
    proceduralBackgroundColor: '#F6F6F6',
    textureShapeTriangles: 20,
    textureShapeCircles: 15,
    textureShapeBars: 15,
    textureShapeSquiggles: 10,
    domainWarpEnabled: false,
    domainWarpIntensity: 0,
    domainWarpScale: 3,
    vignetteIntensity: 0,
    vignetteRadius: 0.8,
    fresnelEnabled: false,
    fresnelPower: 2,
    fresnelIntensity: 0.5,
    fresnelColor: '#FFFFFF',
    iridescenceEnabled: false,
    iridescenceIntensity: 0.5,
    iridescenceSpeed: 1,
    prismEdgeEnabled: false,
    prismEdgeIntensity: 0.5,
    prismEdgeThinness: 3,
    prismEdgeSpread: 1,
    prismEdgeSpeed: 0.5,
    prismEdgeRipple: 1,
    bloomIntensity: 0,
    bloomThreshold: 0.7,
    chromaticAberration: 0,
    shapeType: 'plane',
    shapeRotationX: 0,
    shapeRotationY: 0,
    shapeRotationZ: 0,
    shapeAutoRotateSpeedX: 0,
    shapeAutoRotateSpeedY: 0,
    sphereRadius: 15,
    torusRadius: 15,
    torusTube: 5,
    cylinderRadius: 10,
    cylinderHeight: 40,
    planeBend: 0,
    planeTwist: 0,
    silhouetteFade: 0.25,
    cylinderFade: 0.08,
    ribbonFade: 0.05,
    flatShading: true,
    cameraLock: true,
    cameraX: 0,
    cameraY: 0,
    cameraZ: 0,
    cameraRotationX: 0,
    cameraRotationY: 0,
    cameraRotationZ: 0,
    cameraZoom: 1,
};

export interface NeatGradientProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
    config?: Partial<NeatConfig & Record<string, unknown>>;
    enableScroll?: boolean;
}

export const NeatGradient: React.FC<NeatGradientProps> = ({
    config = {},
    enableScroll = true,
    className = "absolute inset-0 w-full h-full scale-105",
    style = { width: '100%', height: '100%' },
    id = "gradient",
    ...restProps
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const mergedConfig = {
            ...DEFAULT_NEAT_CONFIG,
            ...config,
        };

        const gradient = new NeatGradientLib({
            ref: canvasRef.current,
            ...mergedConfig,
        });

        let handleScroll: (() => void) | null = null;

        if (enableScroll) {
            handleScroll = () => {
                gradient.yOffset = window.scrollY;
            };
            window.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            if (handleScroll) {
                window.removeEventListener('scroll', handleScroll);
            }
            gradient.destroy();
        };
    }, [config, enableScroll]);

    return (
        <canvas
            ref={canvasRef}
            id={id}
            className={className}
            style={style}
            {...restProps}
        />
    );
};

export default NeatGradient;
