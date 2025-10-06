import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordGenerator } from '@/components/PasswordGenerator';
import { VaultEntry } from '@/components/VaultEntry';
import { VaultEntryDialog } from '@/components/VaultEntryDialog';
import { Shield, Plus, Search, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { encryptVaultEntry, decryptVaultEntry, type VaultEntry as VaultEntryType } from '@/lib/encryption';
import type { User } from '@supabase/supabase-js';

interface StoredVaultEntry {
  id: string;
  encrypted_data: string;
  created_at: string;
  updated_at: string;
}

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [vaultEntries, setVaultEntries] = useState<(VaultEntryType & { id: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<(VaultEntryType & { id: string }) | undefined>();
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadVaultEntries(session.user.id);
      } else {
        navigate('/auth');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadVaultEntries(session.user.id);
      } else {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadVaultEntries = async (userId: string) => {
    const { data, error } = await supabase
      .from('vault_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load vault entries');
      return;
    }

    if (data) {
      const decryptedEntries = await Promise.all(
        (data as StoredVaultEntry[]).map(async (entry) => {
          const decrypted = await decryptVaultEntry(entry.encrypted_data, userId);
          return { ...decrypted, id: entry.id };
        })
      );
      setVaultEntries(decryptedEntries);
    }
  };

  const handleSaveEntry = async (entry: VaultEntryType) => {
    if (!user) return;

    try {
      const encryptedData = await encryptVaultEntry(entry, user.id);

      if (dialogMode === 'add') {
        const { error } = await supabase
          .from('vault_entries')
          .insert({
            user_id: user.id,
            encrypted_data: encryptedData,
          });

        if (error) throw error;
        toast.success('Entry added successfully!');
      } else if (editingEntry) {
        const { error } = await supabase
          .from('vault_entries')
          .update({ encrypted_data: encryptedData })
          .eq('id', editingEntry.id);

        if (error) throw error;
        toast.success('Entry updated successfully!');
      }

      loadVaultEntries(user.id);
      setDialogOpen(false);
      setEditingEntry(undefined);
    } catch (error) {
      toast.error('Failed to save entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    const { error } = await supabase
      .from('vault_entries')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete entry');
    } else {
      toast.success('Entry deleted successfully!');
      if (user) loadVaultEntries(user.id);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const filteredEntries = vaultEntries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Secure Vault</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Password Generator */}
          <div>
            <PasswordGenerator />
          </div>

          {/* Vault Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Vault</h2>
              <Button
                onClick={() => {
                  setDialogMode('add');
                  setEditingEntry(undefined);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Vault Entries */}
            <div className="space-y-4">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? 'No entries found' : 'No vault entries yet. Add your first one!'}
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <VaultEntry
                    key={entry.id}
                    entry={entry}
                    onEdit={() => {
                      setDialogMode('edit');
                      setEditingEntry(entry);
                      setDialogOpen(true);
                    }}
                    onDelete={() => handleDeleteEntry(entry.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <VaultEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveEntry}
        entry={editingEntry}
        mode={dialogMode}
      />
    </div>
  );
}