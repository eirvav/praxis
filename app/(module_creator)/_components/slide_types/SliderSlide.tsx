import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// TypeScript type for the slider configuration
export interface SliderConfig {
  type: 'slider';
  sliders: Array<{
    id: string;
    title: string;
    question: string;
    description: string;
    minLabel: string;
    midLabel: string;
    maxLabel: string;
    min: number;
    max: number;
    step: number;
    required: boolean;
    defaultValue: number;
  }>;
  isRequired: boolean;
}

// Default configuration for a new slider slide
export const createDefaultSliderConfig = (): SliderConfig => ({
  type: 'slider',
  sliders: [{
    id: crypto.randomUUID(),
    title: '',
    question: '',
    description: '',
    minLabel: 'Not at all',
    midLabel: 'Somewhat',
    maxLabel: 'Very much',
    min: 0,
    max: 5,
    step: 1,
    required: true,
    defaultValue: 3,
  }],
  isRequired: true,
});

// Badge component for the slide type
export const SliderSlideTypeBadge = () => {
  return (
    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
      <MoveHorizontal className="w-3 h-3 mr-1" />
    Slider
    </Badge>
  );
};

// Individual slider item component
const SliderItem = ({ 
  slider, 
  onChange, 
}: { 
  slider: SliderConfig['sliders'][0],
  onChange: (updatedSlider: SliderConfig['sliders'][0]) => void,
  onDelete: () => void,
  isOnlySlider: boolean
}) => {
  const boxCount = slider.max - slider.min + 1;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
      <div className="space-y-4">
        <div>
          <Label htmlFor={`question-${slider.id}`}>Question</Label>
          <Input
            id={`question-${slider.id}`}
            value={slider.question || ''}
            onChange={(e) => onChange({ ...slider, question: e.target.value })}
            placeholder="Enter your question"
            className="mt-1.5 bg-white"
          />
        </div>

        <div>
          <Label htmlFor={`description-${slider.id}`}>Description (Optional)</Label>
          <Input
            id={`description-${slider.id}`}
            value={slider.description || ''}
            onChange={(e) => onChange({ ...slider, description: e.target.value })}
            placeholder="Enter description"
            className="mt-1.5 bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label>Labels</Label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Input
                value={slider.minLabel || ''}
                onChange={(e) => onChange({ ...slider, minLabel: e.target.value })}
                placeholder="Start label"
                className="text-sm bg-white"
              />
            </div>
            <div>
              <Input
                value={slider.midLabel || ''}
                onChange={(e) => onChange({ ...slider, midLabel: e.target.value })}
                placeholder="Middle label"
                className="text-sm bg-white"
              />
            </div>
            <div>
              <Input
                value={slider.maxLabel || ''}
                onChange={(e) => onChange({ ...slider, maxLabel: e.target.value })}
                placeholder="End label"
                className="text-sm bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Number Preview */}
        <div className="pt-4">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="mt-7">
            <div className="relative">
              <div className="flex justify-between absolute -top-6 w-full text-sm text-muted-foreground">
                <span>{slider.minLabel}</span>
                <span>{slider.midLabel}</span>
                <span>{slider.maxLabel}</span>
              </div>
              <div className="flex justify-between gap-2">
                {Array.from({ length: boxCount }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 flex items-center justify-center h-12 rounded-md border text-sm font-medium",
                      "bg-white hover:bg-emerald-50 hover:border-emerald-200",
                      "text-gray-700 hover:text-emerald-700"
                    )}
                  >
                    {slider.min + i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main slide content component
interface SliderSlideContentProps {
  config: SliderConfig;
  onConfigChange: (config: SliderConfig) => void;
}

export default function SliderSlideContent({ config, onConfigChange }: SliderSlideContentProps) {
  const addSlider = () => {
    const newSlider = {
      id: crypto.randomUUID(),
      title: '',
      question: '',
      description: '',
      minLabel: 'Not at all',
      midLabel: 'Somewhat',
      maxLabel: 'Very much',
      min: 0,
      max: 5,
      step: 1,
      required: true,
      defaultValue: 3,
    };

    onConfigChange({
      ...config,
      sliders: [...config.sliders, newSlider],
    });
  };

  const updateSlider = (index: number, updatedSlider: SliderConfig['sliders'][0]) => {
    const updatedSliders = [...config.sliders];
    updatedSliders[index] = updatedSlider;
    onConfigChange({ ...config, sliders: updatedSliders });
  };

  const removeSlider = (index: number) => {
    if (config.sliders.length > 1) {
      const updatedSliders = config.sliders.filter((_, i) => i !== index);
      onConfigChange({ ...config, sliders: updatedSliders });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        {config.sliders.map((slider, index) => (
          <div key={slider.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-700">Slider {index + 1}</h3>
              {config.sliders.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSlider(index)}
                  className="text-red-500 hover:bg-red-600 hover:text-white bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <SliderItem
              key={slider.id}
              slider={slider}
              onChange={(updatedSlider) => updateSlider(index, updatedSlider)}
              onDelete={() => removeSlider(index)}
              isOnlySlider={config.sliders.length === 1}
            />
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-end pt-4">
        <Button
          onClick={addSlider}
          size="lg"
          className="h-10 rounded-lg"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Slider
        </Button>
      </div>
    </div>
  );
} 