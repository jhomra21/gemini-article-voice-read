import type { Album } from "../lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard(props: AlbumCardProps) {
  return (
    <Card class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
      <CardHeader class="aspect-square overflow-hidden">
        <img
          src={props.album.coverart_url || "/placeholder-album.jpg"}
          alt={`${props.album.title} cover art`}
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <CardTitle class="text-lg font-semibold text-gray-900 dark:text-white">{props.album.title}</CardTitle>
      </CardHeader>
     
        
         <CardContent><p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {new Date(props.album.release_date).getFullYear()}
        </p>
        
      </CardContent>
      <CardFooter>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {props.album.songs.length} {props.album.songs.length === 1 ? 'track' : 'tracks'}
        </p>
      </CardFooter>
    </Card>
  );
} 