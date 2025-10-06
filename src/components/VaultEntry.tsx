import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Copy, Edit, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { VaultEntry as VaultEntryType } from '@/lib/encryption';

interface VaultEntryProps {
  entry: VaultEntryType;
  onEdit: () => void;
  onDelete: () => void;
}

export function VaultEntry({ entry, onEdit, onDelete }: VaultEntryProps) {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{entry.title}</h3>
            {entry.url && (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          
          {entry.username && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Username:</span>
              <span>{entry.username}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(entry.username, 'Username')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Password:</span>
            <code className="font-mono">
              {showPassword ? entry.password : '••••••••'}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(entry.password, 'Password')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          
          {entry.notes && (
            <p className="text-sm text-muted-foreground mt-2">{entry.notes}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}