import { Controller, Post, Get, Patch, Delete, Body, UseGuards, Request, HttpCode, HttpStatus, ForbiddenException, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto, CreateManagerDto, VerifyOtpDto } from './dto/auth.dto';
import { UpdateManagerStationsDto } from './dto/update-manager-stations.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'User already exists or invalid input' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for two-factor authentication' })
  @ApiResponse({ status: 200, description: 'OTP sent to user email/phone' })
  @ApiResponse({ status: 400, description: 'User not found' })
  async requestOtp(@Body() body: { email: string }) {
    return this.authService.requestOtp(body.email);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get access token' })
  @ApiResponse({ status: 200, description: 'OTP verified, access token returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    // Client should discard tokens
    return { message: 'Logged out successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User profile returned' })
  async getProfile(@Request() req: any) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('managers')
  @ApiOperation({ summary: 'Get all managers (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Managers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getManagers(@Request() req: any) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.authService.getAllManagers();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new manager with station assignments (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Manager successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input or user already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Admin access required' })
  async createManager(@Request() req: any, @Body() createManagerDto: CreateManagerDto) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.authService.createManager(createManagerDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('managers/:managerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a manager (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Manager removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Manager not found' })
  async removeManager(@Request() req: any, @Param('managerId') managerId: string) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.authService.removeManager(managerId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('managers/:managerId/stations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update manager station assignments (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Manager stations updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Manager not found' })
  async updateManagerStations(
    @Request() req: any,
    @Param('managerId') managerId: string,
    @Body() updateDto: UpdateManagerStationsDto
  ) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.authService.updateManagerStations(managerId, updateDto.stationIds);
  }
}
