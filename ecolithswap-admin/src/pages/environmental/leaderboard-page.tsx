import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { environmentalAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Crown, Star, Medal } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  ecoCredits: number;
  userId: string;
}

export function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['ecoLeaderboard'],
    queryFn: () => environmentalAPI.getLeaderboard().then(res => res.data),
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Star className="h-6 w-6 text-yellow-600" />;
    return <span className="font-semibold">{rank}</span>;
  };

  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold">Eco-Warriors Leaderboard</h2>
        <p className="text-gray-600 mt-2">
          Celebrating the top contributors to our environmental goals.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Top Users by EcoCredits</CardTitle>
            <CardDescription>Users who have earned the most credits through recycling and sustainable actions.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <div className="text-center py-8">Loading leaderboard...</div>
             ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">EcoCredits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard?.map((entry) => (
                    <TableRow key={entry.userId} className={entry.rank <= 3 ? 'bg-gray-50' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-center h-full">
                           {getRankIcon(entry.rank)}
                        </div>
                      </TableCell>
                      <TableCell>{entry.username}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{entry.ecoCredits.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
             )}
          </CardContent>
        </Card>
    </div>
  );
}
