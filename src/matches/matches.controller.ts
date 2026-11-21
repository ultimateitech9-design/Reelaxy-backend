import { parseBlockScope } from './block-scope';
import { Controller, Delete, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchStatus } from './match.entity';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  async getMatches(@Query('filter') filter: 'active' | 'sent' | 'received' | 'blocked' | 'messages', @Query('limit') limit: string, @Query('offset') offset: string, @Request() req) {
    const userId = req.user.userId;
    return this.matchesService.findForFilter(userId, filter, Number(limit) || 12, Number(offset) || 0);
  }

  @Get('summary')
  async getSummary(@Request() req) {
    return this.matchesService.getSummary(req.user.userId);
  }

  @Post('swipe')
  async swipeProfile(@Request() req, @Body('receiverId') receiverId: string, @Body('action') action: 'like' | 'pass') {
    const userId = req.user.userId;
    return this.matchesService.swipe(userId, receiverId, action);
  }

  @Patch('unblock/:id')
  async unblockUser(@Request() req, @Param('id') id: string) {
    return this.matchesService.unblockMatch(id, req.user.userId);
  }

  /** Free direct chat from Discover: returns the conversation id to open. */
  @Post('chat/:userId')
  async startChat(@Request() req, @Param('userId') userId: string) {
    return this.matchesService.startChat(req.user.userId, userId);
  }

  @Delete('pending/:id')
  async deletePendingRequest(@Request() req, @Param('id') id: string) {
    return this.matchesService.deletePendingRequest(id, req.user.userId);
  }

  @Patch('block/:id')
  async blockUser(@Request() req, @Param('id') id: string, @Body('scope') scope?: string) {
    return this.matchesService.blockMatch(id, req.user.userId, parseBlockScope(scope));
  }

  @Post('respond')
  async respond(@Request() req, @Body('matchId') matchId: string, @Body('action') action: 'accept' | 'decline') {
    return this.matchesService.respond(matchId, action, req.user.userId);
  }
}
