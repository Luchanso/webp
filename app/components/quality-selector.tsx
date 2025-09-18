'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface QualitySelectorProps {
  quality: number;
  onQualityChange: (quality: number) => void;
}

export function QualitySelector({ quality, onQualityChange }: QualitySelectorProps) {
  return (
    <div className="grid gap-2 mt-4">
      <div className="flex justify-between items-center">
        <Label htmlFor="quality-slider">WebP quality: {Math.min(quality, 99.9)}%</Label>
        <span className="text-xs text-muted-foreground">
          {quality < 50 ? 'Low' : quality < 80 ? 'Average' : 'High'}
        </span>
      </div>
      <Slider
        id="quality-slider"
        min={0}
        max={100}
        step={5}
        value={[quality]}
        onValueChange={([value]) => onQualityChange(value)}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0% (smaller size)</span>
        <span>99.9% (best quality)</span>
      </div>
    </div>
  );
}