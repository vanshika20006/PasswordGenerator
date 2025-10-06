import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { generatePassword, calculatePasswordStrength, type PasswordOptions } from '@/lib/passwordGenerator';
import { toast } from 'sonner';

export function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
  });

  const strength = calculatePasswordStrength(password);

  useEffect(() => {
    generateNewPassword();
  }, [options]);

  const generateNewPassword = () => {
    const newPassword = generatePassword(options);
    setPassword(newPassword);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success('Password copied to clipboard!');
      
      // Auto-clear after 15 seconds
      setTimeout(() => {
        setCopied(false);
      }, 15000);
    } catch (err) {
      toast.error('Failed to copy password');
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-2xl font-bold mb-6">Password Generator</h2>
      
      <div className="space-y-6">
        {/* Generated Password Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={password}
              readOnly
              className="font-mono text-lg bg-muted"
            />
            <Button
              onClick={copyToClipboard}
              variant="secondary"
              size="icon"
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              onClick={generateNewPassword}
              variant="secondary"
              size="icon"
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className={`text-sm ${strength.color} font-medium`}>
            Strength: {strength.label}
          </div>
        </div>

        {/* Length Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Length: {options.length}</Label>
          </div>
          <Slider
            value={[options.length]}
            onValueChange={([value]) => setOptions({ ...options, length: value })}
            min={8}
            max={32}
            step={1}
            className="w-full"
          />
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
            <Switch
              id="uppercase"
              checked={options.uppercase}
              onCheckedChange={(checked) => setOptions({ ...options, uppercase: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="lowercase">Lowercase (a-z)</Label>
            <Switch
              id="lowercase"
              checked={options.lowercase}
              onCheckedChange={(checked) => setOptions({ ...options, lowercase: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="numbers">Numbers (0-9)</Label>
            <Switch
              id="numbers"
              checked={options.numbers}
              onCheckedChange={(checked) => setOptions({ ...options, numbers: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="symbols">Symbols (!@#$%)</Label>
            <Switch
              id="symbols"
              checked={options.symbols}
              onCheckedChange={(checked) => setOptions({ ...options, symbols: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="excludeSimilar">Exclude Similar (O/0, l/1)</Label>
            <Switch
              id="excludeSimilar"
              checked={options.excludeSimilar}
              onCheckedChange={(checked) => setOptions({ ...options, excludeSimilar: checked })}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}