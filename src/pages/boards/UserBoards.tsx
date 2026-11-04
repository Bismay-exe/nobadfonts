import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/shared/SEO';
import { useBoards, type Board } from '../../hooks/useBoards';
import { useSavedBoards } from '../../hooks/useSavedBoards';
import BoardCard from '../../components/boards/BoardCard2';
import { Bookmark } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface SocialItem {
  href: string;
  label: string;
  image?: string;
  svg?: string;
  className?: string;
}

type Tab = 'boards' | 'saved';

export default function UserBoards() {
  const { username } = useParams<{ username: string }>();
  const { user, profile } = useAuth();
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('boards');

  const { deleteBoards } = useBoards();
  const { savedBoards, loading: savedLoading } = useSavedBoards();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(new Set());

  const toggleBoardSelection = useCallback((boardId: string) => {
    setSelectedBoards(prev => {
      const next = new Set(prev);
      if (next.has(boardId)) next.delete(boardId);
      else next.add(boardId);
      return next;
    });
  }, []);

  const handleDeleteSelected = async () => {
    if (selectedBoards.size === 0) return;
    const ids = Array.from(selectedBoards);
    const success = await deleteBoards(ids);
    if (success) {
      setBoards(prev => prev.filter(b => !selectedBoards.has(b.id)));
      setSelectionMode(false);
      setSelectedBoards(new Set());
    } else {
      alert("Failed to delete some boards. Please try again.");
    }
  };

  const isOwnProfile = user && profile?.username === username;

  const socials: SocialItem[] = [];

  const getSocialItemFromUrl = (url: string): SocialItem => {
    const lower = url.toLowerCase();
    if (lower.includes('instagram.com')) {
      return {
        href: url,
        label: 'Instagram',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAABsFBMVEVHcEx6Gft+F/x0FPyBDPORB+WnAt69AN/IANzSANrVANDpEKtpGv52FvjhANfhAMnbBLfVBJGHGP2YF/ueAu+zAPDrALTtA6quMNrKWuPhYtzvVMHvILzuAMbMf+z+3/3/////9//vd9v5AbryAqWuGvrxr9371vf2tePwp9/vnuD/+//+ArP9AJ395vrTRNPucMLwAo7HG/fxFM39wPHtPZ38AoXjGfD6E7TsJ6rzI5PzV6P7AXX9FpDtocvxZJ79AGTwrb39EGf8InX87PPxHGv+E3j8H1vugJX7KlLxZJH1u8v7M1X2Kz78M0XwbF79Kmbyu6/9OTD9QUPwWGf//vPrQlr0NGj7AFn0imzySCL7Szb4yb/7QiT8UBL+Wi3+7Nn1BEbzz6b5Ww79ZiL0dUf11bD8eyj6aAH+dg/+bh3zFUX93OjymjH9ign8hQT5hRj8fQ32t2f/+djypEz5kAL22539dwf+mQL5ogD3zmHzn4r4Go77Yyv/qgT+sAL5rwD5vzL1yVr6mAf9tgD9vQD/xAD/KnD2lwD8ygD+OGP/LGv+rQ3+uQj/ywL7VDI4+UxjAAAAkHRSTlMAXMb/////////xl0Kz///zgv//////8r//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8X/////xl3//////8/////OC//PClzG/8UUwjnzAAACFUlEQVR4ATXQRbobRxhG4fO16q8moZmZPQkz0wayg3CygHBGnmYjwTV4FpqamRl1o3u7pWqVoR+fYb3FAiQBQiDaAaQJiK4WW6JFARiS7joe2qBdPRbCAAR4IY0AabxMiMdJC32gZuLavYqylVaHnf97pEjLYdndZVNSqXWC3CSfZVpCO+FenvR1ru9py6tq2XjYgEt6vd5Y6OyOVeSPIr87jGl515GbM9gTwrmd1zfk1coLbKqqtbfWhpDkARLg5kSpbbjVc9fMriVcXXHVYhR4F2DVvXnfWHVZscDGcVWzjDUX8JBcv25Aj3hH2bIs63gtAeAczm3qULFeGtc79Hg8W1gW/GMmyX2xBsyvjGnTeO/LKsrTlvg8AbwZ2MNnQbuoRUscDM3s+XoQ0rSXb9IGvwbKNeAcdCFTTE7tL8edcnZ4v6DTrizLEnDOFt46fCeJtw/vKO9bTouNBCMzW2kfjA4fHr22rDJPQQEhcWb95+f2qPnw5ZeHsTFTsVWdawF9bFBN1khiiQ7TGaGKydG3J+fdPX0hMv35oQTUSmrqWZiMDu7ZfkL39FU69+jX58tVwC0ANz3I0yHM45K+qXxHqL7wH096vlx/YbF2Cy/rp/sFXkKqIIN7JPfnVNVD/FscmHgvQBCJoY6LnXo6C1X96ncOK2fQfkqDXIwsRj+DN4SAn1U5wGDWxDidNqGe7r9zAB4A0j29NbySqvYAAAAASUVORK5CYII=',
      };
    }
    if (lower.includes('behance.net')) {
      return {
        href: url,
        label: 'Behance',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAeFBMVEUFWP8AVv8ATP8ASv8AUf+lt/+ywf9lhf8ARv8AU/8AQP/y9f////91kv/q8P8ARP/S2v9ujf/l7P8ASP8yZv8ATv+5xv9nh//M1f+Spv/BzP/Y3/+4xP+ZrP+su/8AJv8AN/8APf/f5v8AL/8oX/88af9Qd/+Kof8IPKxZAAAAvUlEQVR4Ac3RRQKDMAAAwZLgLO5ab///w7qgZxZnLpHNcspsa0UhHwl1CqWmP9IM8/5hPfpD2+GVLlX38fT8P/QIQteNIFYUVUnSB/1h5qdmDqq6KYDS76Mt0oratqBuoBX/yCMnjjuq7S6BHkZZljkQR9RVlYGh/mG2l7ENbYQXRdEhynvoq+rRoykoj/bxdB5OJdShzME4lSDHi1Cbfseji/pF2WWPOuM+vfjcdldVnVl4KxXp8patFhe6ATwRD2y5uYPGAAAAAElFTkSuQmCC',
      };
    }
    if (lower.includes('twitter.com') || lower.includes('x.com')) {
      return {
        href: url,
        label: 'Twitter',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAAAAABXZoBIAAAAqUlEQVR4AdXQEQwCUQDG8b87pFkcRmGuyfFpFB+HuZ20/DA4yndLHj17dHJ08G/V1qp7vvWjT77t28cfKlIIMS54KmPa8uli35l4WGvNtyQ7G2CmF37M7WncQe+NidKW5CyYyDhboY5kRZelLshz5OyevK0dySVZNz1iT07r0LkpbJmqdcUoJyt+VVrAxkB0NRnzKhysGQfevt++mgavfOpi844hhFjyf+4xHWjgrPr73gAAAABJRU5ErkJggg==',
      };
    }
    if (lower.includes('linkedin.com')) {
      return {
        href: url,
        label: 'LinkedIn',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBjUaECkUKy_fw68AQN07BBrtcAksp-iuJ_Ow_FYXc6w&s',
      };
    }
    if (lower.includes('dribbble.com')) {
      return {
        href: url,
        label: 'Dribbble',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2m6.605 4.61a8.5 8.5 0 0 1 1.93 5.314c-.281-.054-3.101-.629-5.943-.271c-.065-.141-.12-.293-.184-.445a25 25 0 0 0-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362M12 3.475c2.17 0 4.154.813 5.662 2.148c-.152.216-1.443 1.941-4.48 3.08c-1.399-2.57-2.95-4.675-3.189-5A8.7 8.7 0 0 1 12 3.475m-3.633.803a54 54 0 0 1 3.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.58 8.58 0 0 1 4.729-5.975M3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215q.371.694.717 1.402l-.336.085c-4.474 1.44-6.858 5.37-7.061 5.702A8.5 8.5 0 0 1 3.453 12.01m3.138 7.053c.137-.235 3.139-5.317 6.772-6.379a22 22 0 0 0-.042-.085a56 56 0 0 1 1.713 6.062A8.5 8.5 0 0 1 12 20.547a8.5 8.5 0 0 1-5.408-1.484m7.644-.959a53 53 0 0 0-1.596-5.703c2.677-.413 5.03.26 5.317.345a8.6 8.6 0 0 1-3.721 5.358"/></svg>',
      };
    }
    if (lower.includes('github.com')) {
      return {
        href: url,
        label: 'GitHub',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M8 .2A8 8 0 0 0 5.47 15.79c.4.074.546-.173.546-.385c0-.19-.007-.693-.01-1.36c-2.226.483-2.695-1.073-2.695-1.073c-.364-.924-.889-1.17-.889-1.17c-.726-.496.055-.486.055-.486c.803.056 1.226.824 1.226.824c.713 1.222 1.872.869 2.328.664c.072-.517.279-.869.508-1.069c-1.776-.202-3.644-.888-3.644-3.953c0-.874.312-1.588.823-2.147c-.082-.202-.357-1.016.078-2.117c0 0 .672-.215 2.2.82A7.7 7.7 0 0 1 8 4.068c.68.004 1.364.092 2.003.27c1.527-1.035 2.198-.82 2.198-.82c.436 1.101.162 1.915.08 2.117c.513.559.822 1.273.822 2.147c0 3.073-1.87 3.749-3.653 3.947c.287.247.543.735.543 1.481c0 1.07-.01 1.933-.01 2.196c0 .214.144.463.55.384A8 8 0 0 0 8 .2"/></svg>',
      };
    }
    if (lower.includes('youtube.com')) {
      return {
        href: url,
        label: 'YouTube',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M23.498 6.186a3.02 3.02 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.02 3.02 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.02 3.02 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.02 3.02 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814M9.545 15.568V8.432L15.818 12z"/></svg>',
      };
    }
    return {
      href: url,
      label: 'Social',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m-1 17.93c-3.95-.49-7-3.85-7-7.93c0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41c0 2.08-.8 3.97-2.1 5.39"/></svg>',
    };
  };

  const rawSocialUrls = [
    profile?.instagram,
    profile?.behance,
    profile?.twitter,
    profile?.linkedin,
  ].filter(Boolean) as string[];

  // Ensure all user's available socials are shown
  const uniqueUrls = Array.from(new Set(rawSocialUrls));
  uniqueUrls.forEach((url) => {
    socials.push(getSocialItemFromUrl(url));
  });

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      setLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, bio')
        .eq('username', username)
        .maybeSingle();

      if (profileError || !profileData) { setNotFound(true); setLoading(false); return; }
      setOwnerProfile(profileData as UserProfile);

      const query = supabase
        .from('boards')
        .select('*, board_fonts(fonts(id, name, font_variants(variant_name, woff2_url, woff_url, ttf_url, otf_url)))')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (!isOwnProfile) query.eq('visibility', 'public');

      const { data: boardsData } = await query;

      const formattedBoards = (boardsData || []).map((b: any) => ({
        ...b,
        preview_fonts: b.board_fonts
          ?.map((bf: any) => {
            const font = bf.fonts;
            if (!font) return null;
            const variants = font.font_variants || [];
            const regular = variants.find((v: any) => v.variant_name === 'Regular') || variants[0];
            return {
              id: font.id,
              name: font.name,
              woff2_url: regular?.woff2_url,
              woff_url: regular?.woff_url,
              ttf_url: regular?.ttf_url,
              otf_url: regular?.otf_url
            };
          })
          ?.filter(Boolean)
          ?.slice(0, 4) || []
      }));

      setBoards(formattedBoards as Board[]);
      setLoading(false);
    };
    load();
  }, [username, isOwnProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-foreground/10 border-t-accent animate-spin" />
      </div>
    );
  }

  if (notFound || !ownerProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-black mb-2">User not found</h1>
        <p className="text-muted mb-6">No user with username <strong>@{username}</strong> exists.</p>
        <Link to="/" className="text-accent hover:underline text-sm font-semibold">← Back to home</Link>
      </div>
    );
  }

  // Saved boards as Board objects (for non-owners we hide saved tab)
  const savedBoardList: Board[] = savedBoards
    .map((sb: any) => sb.boards)
    .filter(Boolean) as Board[];

  return (
    <div className="pt-24 min-h-screen bg-background">
      <SEO
        title={`${ownerProfile.full_name}'s Boards — NoBadFonts`}
        description={`Font boards curated by ${ownerProfile.full_name} on NoBadFonts.`}
      />

      {/* Profile header */}
      <div className="relative">
        {/* <div className='h-px w-full bg-linear-to-r from-transparent via-foreground/8 to-transparent absolute bottom-0 left-0 right-0' /> */}
        <div className="max-w-5xl mx-auto px-4 py-8 flex md:flex-row flex-col zmd:items-center gap-5">
          {ownerProfile.avatar_url ? (
            <img src={ownerProfile.avatar_url} alt={ownerProfile.full_name} className="w-24 h-24 md:w-30 md:h-30 rounded-full object-cover border-2 border-foreground/10" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-card-background flex items-center justify-center text-foreground text-xl font-black">
              {ownerProfile.full_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-wide text-foreground">{ownerProfile.full_name}</h1>
            <p className={`flex items-center gap-0.5 text-base font-medium tracking-wide text-muted`}>
              nobadfonts.in/
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.596 20.093a11.44 11.44 0 0 1-4.48 2.943l-.08.025c-1.634.594-3.52.938-5.486.938h-.1h.005l-.189.001c-1.766 0-3.456-.327-5.012-.923l.096.032a11.5 11.5 0 0 1-3.93-2.474l.004.003a11 11 0 0 1-2.502-3.719l-.026-.073a12.5 12.5 0 0 1-.895-4.676l.001-.152v.008l-.001-.113c0-1.686.361-3.288 1.01-4.733l-.029.073a12 12 0 0 1 2.669-3.808l.004-.004A12.5 12.5 0 0 1 7.535.938l.084-.03C9.024.334 10.655.001 12.363.001h.098h-.005h.041c1.52 0 2.986.234 4.363.668l-.103-.028a11.2 11.2 0 0 1 3.724 1.951l-.023-.017a9.55 9.55 0 0 1 2.552 3.17l.025.055A9.94 9.94 0 0 1 24 10.364v-.012l.002.187a10 10 0 0 1-.559 3.301l.021-.07a7.5 7.5 0 0 1-1.443 2.494l.007-.009a5.9 5.9 0 0 1-2.015 1.485l-.037.015a6 6 0 0 1-2.409.498h-.018h.001a3.3 3.3 0 0 1-2.099-.617l.01.007a1.9 1.9 0 0 1-.782-1.534v-.015v.001h-.16a5.3 5.3 0 0 1-1.48 1.456l-.02.012a4.26 4.26 0 0 1-2.487.697h.007a4.18 4.18 0 0 1-3.418-1.447l-.005-.005a5.68 5.68 0 0 1-1.205-3.79v.013c.001-.96.167-1.88.473-2.735l-.018.057a7.7 7.7 0 0 1 1.312-2.37l-.011.014a6.7 6.7 0 0 1 1.985-1.643l.035-.017a5.4 5.4 0 0 1 2.612-.626h-.004a3.96 3.96 0 0 1 2.109.525l-.019-.01c.503.281.89.717 1.103 1.242l.006.017h.032l.262-1.291h2.903l-1.28 6.101q-.064.448-.177 1.002c-.069.31-.11.666-.113 1.032v.002l-.001.063c0 .314.08.61.22.868l-.005-.01a.87.87 0 0 0 .834.369h-.004a2.44 2.44 0 0 0 2.099-1.341l.006-.014a6.86 6.86 0 0 0 .829-3.659l.001.016l.001-.155c0-1.183-.241-2.31-.676-3.335l.021.056a7.1 7.1 0 0 0-1.801-2.513l-.007-.006a7.75 7.75 0 0 0-2.698-1.517l-.055-.015a11.1 11.1 0 0 0-3.378-.515l-.115.001h.006l-.122-.001a9.55 9.55 0 0 0-3.707.744l.063-.024A8.6 8.6 0 0 0 5.715 5.34l-.003.003a9.1 9.1 0 0 0-1.854 2.938l-.021.062a10.5 10.5 0 0 0-.675 3.747c0 1.372.257 2.684.727 3.89l-.025-.073a8.4 8.4 0 0 0 1.968 2.917l.003.003a8.6 8.6 0 0 0 2.972 1.835l.06.019c1.114.406 2.4.641 3.741.641l.144-.001h-.007a11.1 11.1 0 0 0 4.62-.865l-.074.027a12.6 12.6 0 0 0 3.513-2.331l-.006.006zM12.391 8.356h-.038c-.504 0-.968.169-1.338.455l.005-.004a3.9 3.9 0 0 0-.987 1.128l-.01.019a5.8 5.8 0 0 0-.613 1.491l-.009.041a6.5 6.5 0 0 0-.214 1.609v.004q.004.44.085.854l-.005-.029c.057.306.171.578.331.817l-.005-.008a1.84 1.84 0 0 0 1.686.851h-.006l.078.001a2.53 2.53 0 0 0 1.431-.44l-.009.006a3.5 3.5 0 0 0 1.004-1.082l.009-.016c.248-.415.446-.895.567-1.405l.007-.035c.106-.421.171-.907.179-1.407v-.005q0-.541-.102-1.052l.006.034a2.7 2.7 0 0 0-.35-.917l.007.012a1.9 1.9 0 0 0-.661-.654l-.009-.005a1.9 1.9 0 0 0-.977-.262l-.066.001h.003z" />
              </svg>
              <Link to={`/${ownerProfile.username}`}
                className='hover:text-foreground transition-colors duration-300 ease-in-out'>
                {ownerProfile.username}
              </Link>
            </p>
            {/* Website */}
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="w-fit mt-3 relative group flex items-center gap-2 bg-card-background py-1 px-2 rounded-full border border-border text-foreground/62 hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32">
                  <g fill="currentColor">
                    <path d="M27.527 4.318c-3.09-3.09-8.12-3.09-11.21 0l-4 4q-.34.345-.63.72a9.1 9.1 0 0 1 3.84-.131q.387.068.77.17l.009.062l2.421-2.421a4.52 4.52 0 0 1 6.4 0c1.76 1.77 1.77 4.64 0 6.4l-4 4c-.76.76-1.73 1.17-2.72 1.28c-1.31.14-2.68-.27-3.68-1.28a4.5 4.5 0 0 1-1.24-2.417a3.25 3.25 0 0 0-1.886.91l-1.086 1.087a7.9 7.9 0 0 0 1.812 2.82a7.86 7.86 0 0 0 4.21 2.19a7.99 7.99 0 0 0 7-2.2l4-4c3.08-3.07 3.08-8.1-.01-11.19" />
                    <path d="M19.528 23.538q.35-.356.646-.742a9.25 9.25 0 0 1-3.851.143h-.001a9 9 0 0 1-.83-.186l-2.375 2.375a4.52 4.52 0 0 1-6.4 0a4.52 4.52 0 0 1 0-6.4l4-4c.76-.76 1.73-1.17 2.72-1.28c1.31-.14 2.68.27 3.68 1.28a4.5 4.5 0 0 1 1.242 2.416a3.25 3.25 0 0 0 1.885-.91l1.086-1.087a7.9 7.9 0 0 0-1.812-2.82a7.86 7.86 0 0 0-4.21-2.19a7.9 7.9 0 0 0-4.61.56c-.86.38-1.67.92-2.38 1.63l-4 4c-3.09 3.09-3.09 8.12 0 11.21s8.12 3.09 11.21 0z" />
                  </g>
                </svg>

                <span className="text-sm sm:text-base">{profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>

                <svg className="absolute -right-5 opacity-0 group-hover:opacity-100 transition-opacity" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 640 640">
                  <path fill="currentColor" d="M384 64c-17.7 0-32 14.3-32 32s14.3 32 32 32h82.7L265.3 329.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L512 173.3V256c0 17.7 14.3 32 32 32s32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-240 96c-44.2 0-80 35.8-80 80v256c0 44.2 35.8 80 80 80h256c44.2 0 80-35.8 80-80v-80c0-17.7-14.3-32-32-32s-32 14.3-32 32v80c0 8.8-7.2 16-16 16H144c-8.8 0-16-7.2-16-16V240c0-8.8 7.2-16 16-16h80c17.7 0 32-14.3 32-32s-14.3-32-32-32z" />
                </svg>
              </a>
            )}

            {/* {ownerProfile.bio && <p className="text-sm text-muted mt-5">{ownerProfile.bio}</p>} */}

            {/* Socials */}
            {socials.length > 0 && (
              <div className="w-fit mt-3 flex items-center zrounded-full zbg-card-background zborder border-border/50">
                <div className="flex -space-x-2">
                  {socials.map((social) => (
                    <a key={`${social.label}-${social.href}`} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="w-10 sm:w-11 h-10 sm:h-11 flex items-center justify-center rounded-full border border-background bg-foreground/16 overflow-hidden hover:z-10 hover:bg-foreground/24 hover:scale-105 transition-all duration-300">
                      {social.image && (
                        <img src={social.image} alt="" className="w-full h-full object-cover" />
                      )}
                      {social.svg && (
                        <span className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: social.svg }} />
                      )}
                    </a>
                  ))}
                </div>
                <span className="px-3 text-xs sm:text-sm text-foreground/50">
                  socials
                </span>
              </div>
            )}
          </div>

          {isOwnProfile && (
            <Link
              to="/profile"
              className="w-fit h-fit text-sm font-semibold text-muted hover:text-foreground border border-foreground/15 px-4 py-2 rounded-xl hover:bg-foreground/4 transition-all"
            >
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Boards grid */}
      <div className="zmax-w-5xl mx-auto px-4 py-8">

        {/* Tabs — only show "Saved" tab on own profile */}
        {isOwnProfile && (
          <div className="flex items-center gap-1 mb-6 border-b border-foreground/8">
            {(['boards', 'saved'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectionMode(false); setSelectedBoards(new Set()); }}
                className={`px-4 py-2.5 text-sm font-semibold capitalize transition-all duration-200 border-b-2 -mb-px flex items-center gap-2 ${activeTab === tab
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted hover:text-foreground'
                  }`}
              >
                {tab === 'saved' && <Bookmark size={14} />}
                {tab === 'boards' ? 'My Boards' : 'Saved Boards'}
                <span className="text-xs font-normal opacity-60">
                  {tab === 'boards' ? boards.length : savedBoardList.length}
                </span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'boards' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                {!selectionMode ?
                  <>Boards <span className="text-muted font-normal">{boards.length}</span></>
                  :
                  <>{selectedBoards.size}/{boards.length} board{selectedBoards.size !== 1 ? 's' : ''} <span className='hidden sm:block'>selected</span></>
                }
              </h2>

              <div className='flex items-center gap-3'>
                {selectionMode && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (selectedBoards.size === boards.length) setSelectedBoards(new Set());
                        else setSelectedBoards(new Set(boards.map(b => b.id)));
                      }}
                      className="text-xs font-semibold text-foreground/60 hover:text-foreground transition-colors"
                    >
                      {selectedBoards.size === boards.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={selectedBoards.size === 0}
                      className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 text-sm font-bold border border-warning/30 text-warning hover:bg-warning/20 transition-colors duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                        <path fill="currentColor" fillRule="evenodd" className="transition-all duration-300 ease-in-out group-hover:[d:path('M9.774_5L3.758_3.94l.174-.986a.5.5_0_0_1_.58-.405L18.411_5h.088h-.087l1.855.327a.5.5_0_0_1_.406.58l-.174.984l-2.09-.368l-.8_13.594A2_2_0_0_1_15.615_22H8.386a2_2_0_0_1-1.997-1.883L5.59_6.5h12.69zH5.5zM9_9l.5_9H11l-.4-9zm4.5_0l-.5_9h1.5l.5-9zm-2.646-7.871l3.94.694a.5.5_0_0_1_.405.58l-.174.984l-4.924-.868l.174-.985a.5.5_0_0_1_.58-.405z')]"
                          d="m18.412 6.5l-.801 13.617A2 2 0 0 1 15.614 22H8.386a2 2 0 0 1-1.997-1.883L5.59 6.5H3.5v-1A.5.5 0 0 1 4 5h16a.5.5 0 0 1 .5.5v1zM10 2.5h4a.5.5 0 0 1 .5.5v1h-5V3a.5.5 0 0 1 .5-.5M9 9l.5 9H11l-.4-9zm4.5 0l-.5 9h1.5l.5-9z"
                        />
                      </svg>
                      <span className='hidden sm:block'>Delete Selected</span>
                    </button>
                  </div>
                )}
                {isOwnProfile && boards.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectionMode(!selectionMode);
                      setSelectedBoards(new Set());
                    }}
                    className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors duration-300 ease-in-out ${selectionMode ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'
                      }`}
                  >
                    {selectionMode ? 'Cancel' : 'Manage Boards'}
                  </button>
                )}
              </div>
            </div>

            {boards.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-semibold text-foreground">{isOwnProfile ? "You don't have any boards yet" : "No public boards yet"}</p>
                <p className="text-sm mt-1">
                  {isOwnProfile ? 'Save fonts to boards from any font page.' : 'This user hasn\'t created any public boards.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 zgrid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2 sm:gap-4">
                {boards.map(board => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    username={username!}
                    ownerAvatar={ownerProfile.avatar_url}
                    selectionMode={selectionMode}
                    isSelected={selectedBoards.has(board.id)}
                    onToggleSelect={() => toggleBoardSelection(board.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'saved' && isOwnProfile && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                Saved Boards <span className="text-muted font-normal text-sm">{savedBoardList.length}</span>
              </h2>
            </div>

            {savedLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-foreground/10 border-t-foreground animate-spin" />
              </div>
            ) : savedBoardList.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <p className="text-4xl mb-3">🔖</p>
                <p className="font-semibold text-foreground">No saved boards yet</p>
                <p className="text-sm mt-1">Browse other users' boards and save the ones you love.</p>
                <Link to="/fonts" className="inline-block mt-4 text-sm font-semibold text-accent hover:underline">
                  Discover fonts →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {savedBoards.map((sb: any) => {
                  const board: Board = sb.boards;
                  const ownerUsername = sb.boards?.profiles?.username || '';
                  if (!board) return null;
                  return (
                    <div key={sb.id} className="relative">
                      <BoardCard
                        board={board}
                        username={ownerUsername}
                        ownerAvatar={sb.boards?.profiles?.avatar_url}
                        selectionMode={false}
                        isSelected={false}
                        onToggleSelect={() => { }}
                      />
                      {/* Owner attribution */}
                      <p className="text-[10px] text-muted mt-1 px-1">
                        by @{ownerUsername}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
