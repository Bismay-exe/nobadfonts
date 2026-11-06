import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/shared/SEO';
import BoardCard from '../components/boards/BoardCard2';
import type { Board } from '../hooks/useBoards';
import { LayoutGrid, ArrowRight, ArrowLeft } from 'lucide-react';

interface OtherUserProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  instagram: string | null;
  behance: string | null;
  twitter: string | null;
  linkedin: string | null;
  role: 'user' | 'member' | 'admin';
  created_at: string | null;
}

interface SocialItem {
  href: string;
  label: string;
  image?: string;
  svg?: string;
}

export default function UserProfile() {
  const { username: rawUsername } = useParams<{ username: string }>();
  const username = rawUsername?.replace(/^@/, '');
  
  const { user, profile } = useAuth();

  // If the logged-in user visits their own dynamic profile URL, redirect to /@me
  if (user && profile?.username && username && profile.username.toLowerCase() === username.toLowerCase()) {
    return <Navigate to="/@me" replace />;
  }

  const [userProfile, setUserProfile] = useState<OtherUserProfile | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    let isMounted = true;

    const loadProfileAndBoards = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, bio, website, instagram, behance, twitter, linkedin, role, created_at')
          .eq('username', username)
          .maybeSingle();

        if (profileError || !profileData) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setUserProfile(profileData as OtherUserProfile);
        }

        // Fetch public boards for this user
        const { data: boardsData, error: boardsError } = await supabase
          .from('boards')
          .select('*, board_fonts(fonts(id, name, font_variants(variant_name, woff2_url, woff_url, ttf_url, otf_url)))')
          .eq('user_id', profileData.id)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false });

        if (!boardsError && boardsData && isMounted) {
          const formattedBoards = boardsData.map((b: any) => ({
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
                  otf_url: regular?.otf_url,
                };
              })
              ?.filter(Boolean)
              ?.slice(0, 4) || [],
          }));

          setBoards(formattedBoards as Board[]);
        }
      } catch (err) {
        console.error('Error loading public profile:', err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfileAndBoards();

    return () => {
      isMounted = false;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-foreground/10 border-t-accent animate-spin" />
      </div>
    );
  }

  if (notFound || !userProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-black mb-2">User Not Found</h1>
        <p className="text-muted mb-6">No user with username <strong>@{username}</strong> exists.</p>
        <Link to="/" className="text-accent hover:underline text-sm font-semibold inline-flex items-center gap-1.5">
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </div>
    );
  }

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

  const socials: SocialItem[] = [
    userProfile.instagram,
    userProfile.behance,
    userProfile.twitter,
    userProfile.linkedin,
  ]
    .filter(Boolean)
    .map(url => getSocialItemFromUrl(url as string));

  return (
    <div className="pt-24 min-h-screen bg-background">
      <SEO
        title={`${userProfile.full_name} (@${userProfile.username}) — Profile | NoBadFonts`}
        description={userProfile.bio || `View ${userProfile.full_name}'s typography profile and curated boards on NoBadFonts.`}
        image={userProfile.avatar_url || undefined}
        url={`/@${userProfile.username}`}
      />

      {/* Profile Header */}
      <div className="relative border-b border-foreground/8">
        <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 border-2 border-foreground/10 bg-card-background overflow-hidden shrink-0 shadow-sm">
            {userProfile.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.full_name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-foreground/10 flex items-center justify-center text-foreground text-3xl font-black">
                {userProfile.full_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>

          {/* Full Name & Handle */}
          <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {userProfile.full_name}
          </h1>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-base text-muted font-medium">
              @{userProfile.username}
            </span>
            {userProfile.role !== 'user' && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-accent/15 text-accent border border-accent/25 uppercase tracking-wide">
                {userProfile.role}
              </span>
            )}
          </div>

          {/* Bio */}
          {userProfile.bio && (
            <p className="mt-4 max-w-xl text-base text-foreground/75 font-normal leading-relaxed">
              {userProfile.bio}
            </p>
          )}

          {/* Website */}
          {userProfile.website && (
            <a
              href={userProfile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card-background border border-border text-xs sm:text-sm text-foreground/70 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32">
                <g fill="currentColor">
                  <path d="M27.527 4.318c-3.09-3.09-8.12-3.09-11.21 0l-4 4q-.34.345-.63.72a9.1 9.1 0 0 1 3.84-.131q.387.068.77.17l.009.062l2.421-2.421a4.52 4.52 0 0 1 6.4 0c1.76 1.77 1.77 4.64 0 6.4l-4 4c-.76.76-1.73 1.17-2.72 1.28c-1.31.14-2.68-.27-3.68-1.28a4.5 4.5 0 0 1-1.24-2.417a3.25 3.25 0 0 0-1.886.91l-1.086 1.087a7.9 7.9 0 0 0 1.812 2.82a7.86 7.86 0 0 0 4.21 2.19a7.99 7.99 0 0 0 7-2.2l4-4c3.08-3.07 3.08-8.1-.01-11.19" />
                  <path d="M19.528 23.538q.35-.356.646-.742a9.25 9.25 0 0 1-3.851.143h-.001a9 9 0 0 1-.83-.186l-2.375 2.375a4.52 4.52 0 0 1-6.4 0a4.52 4.52 0 0 1 0-6.4l4-4c.76-.76 1.73-1.17 2.72-1.28c1.31-.14 2.68.27 3.68 1.28a4.5 4.5 0 0 1 1.242 2.416a3.25 3.25 0 0 0 1.885-.91l1.086-1.087a7.9 7.9 0 0 0-1.812-2.82a7.86 7.86 0 0 0-4.21-2.19a7.9 7.9 0 0 0-4.61.56c-.86.38-1.67.92-2.38 1.63l-4 4c-3.09 3.09-3.09 8.12 0 11.21s8.12 3.09 11.21 0z" />
                </g>
              </svg>
              <span>{userProfile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
            </a>
          )}

          {/* Socials */}
          {socials.length > 0 && (
            <div className="flex items-center gap-2 mt-5">
              <div className="flex items-center rounded-full bg-card-background border border-border/50 p-1">
                <div className="flex -space-x-2">
                  {socials.map((social) => (
                    <a
                      key={`${social.label}-${social.href}`}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-background bg-foreground/15 overflow-hidden hover:z-10 hover:bg-foreground/25 hover:scale-105 transition-all duration-300"
                    >
                      {social.image && (
                        <img src={social.image} alt="" className="w-full h-full object-cover" />
                      )}
                      {social.svg && (
                        <span
                          className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                          dangerouslySetInnerHTML={{ __html: social.svg }}
                        />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions / Boards Link */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to={`/@${userProfile.username}/boards`}
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-2xl font-semibold text-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              <LayoutGrid size={16} />
              <span>View Boards ({boards.length})</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Public Boards Preview Grid */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Boards
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-foreground/8 text-muted">
              {boards.length}
            </span>
          </div>

          {boards.length > 0 && (
            <Link
              to={`/@${userProfile.username}/boards`}
              className="text-sm font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <span>View all boards</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {boards.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-foreground/15 rounded-3xl">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-base font-semibold text-foreground mb-1">No Public Boards Yet</p>
            <p className="text-sm text-muted">@{userProfile.username} has not shared any font boards publicly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {boards.slice(0, 8).map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                username={userProfile.username}
                ownerAvatarUrl={userProfile.avatar_url}
                ownerName={userProfile.full_name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

