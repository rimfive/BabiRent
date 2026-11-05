import { supabase } from '../config/supabase';
import { Article, FiltresArticle } from '../types';

const dbToArticle = (row: any): Article => ({
  id:               row.id,
  proprietaireId:   row.proprietaire_id,
  titre:            row.titre,
  description:      row.description ?? '',
  photos:           row.photos ?? [],
  prix:             row.prix,
  typeTransaction:  row.type_transaction,
  categorie:        row.categorie,
  ville:            row.ville,
  pays:             row.pays ?? "Côte d'Ivoire",
  etat:             row.etat ?? 'bon_etat',
  disponible:       row.disponible ?? true,
  note:             row.note ?? 0,
  nombreAvis:       row.nombre_avis ?? 0,
  createdAt:        row.created_at ?? new Date().toISOString(),
});

export const creerArticle = async (
  data: Omit<Article, 'id' | 'createdAt' | 'note' | 'nombreAvis'>,
): Promise<string> => {
  const { data: result, error } = await supabase
    .from('articles')
    .insert({
      proprietaire_id:  data.proprietaireId,
      titre:            data.titre,
      description:      data.description,
      photos:           data.photos,
      prix:             data.prix,
      type_transaction: data.typeTransaction,
      categorie:        data.categorie,
      ville:            data.ville,
      pays:             data.pays,
      etat:             data.etat,
      disponible:       data.disponible,
      note:             0,
      nombre_avis:      0,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return result.id;
};

export const getArticles = async (filtres?: FiltresArticle): Promise<Article[]> => {
  let query = supabase
    .from('articles')
    .select('*')
    .eq('disponible', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (filtres?.ville)            query = query.eq('ville', filtres.ville);
  if (filtres?.categorie)        query = query.eq('categorie', filtres.categorie);
  if (filtres?.typeTransaction)  query = query.eq('type_transaction', filtres.typeTransaction);
  if (filtres?.prixMax)          query = query.lte('prix', filtres.prixMax);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToArticle);
};

export const getArticle = async (id: string): Promise<Article | null> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbToArticle(data);
};

export const getArticlesProprietaire = async (uid: string): Promise<Article[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('proprietaire_id', uid)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToArticle);
};

export const supprimerArticle = async (id: string): Promise<void> => {
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) throw new Error(error.message);
};
