#!C:/Perl/bin/perl.exe -w
use strict;
use Carp;
use Win32;
use Win32::API;
use Win32::GuiTest qw( FindWindowLike
                       GetChildWindows
                       GetParent
		       GetClassName
		       GetWindowText
		       SetFocus
                       SendKeys
                       SetForegroundWindow
                       SetActiveWindow
                    );

$| = 1; # NO BUFFERING

sub sendKeyToBrowser
{
    my $key = shift;
    my ($cp) = FindWindowLike('', "Mozilla Firefox");
    SetActiveWindow($cp);
    SetForegroundWindow($cp);
    SetFocus($cp);
    SendKeys($key);
}

sub onlineMode
{
    my ($cp) = FindWindowLike('', "Mozilla Firefox");
    while(!$cp)
    {
	print "Waiting for Firefox to start...\n";
	sleep(4);
	($cp) = FindWindowLike('', "Mozilla Firefox");
    }
    SetActiveWindow($cp);
    SetForegroundWindow($cp);
    SetFocus($cp);
    sleep(1);
    SendKeys("%FW");
}

BEGIN {
    my %LPTS = (
		'LPT1' => 0x3BC,
		'LPT2' => 0x378,
		'LPT3' => 0x278
		);
    my @k = keys %LPTS;

    my $GetPortVal = new Win32::API("inpout32","Inp32",['I'],'I');
    my $SetPortVal = new Win32::API("inpout32","Out32",['I','I'],'I');

    my ( $gAddr, $inaddr, $cntlAddr );

    initParallelPort('LPT2');

    sub initParallelPort {
	$gAddr    = $LPTS{(shift)};
	$inaddr   = $gAddr + 1;
	$cntlAddr = $gAddr + 2;
    }
    sub nextParallelPort {
        my $i = 0;
	while ($LPTS{$k[$i]} != $gAddr) { $i++; }
	initParallelPort($k[($i+1)%($#k + 1)]);
    }
    sub currentParallelPort {
        my $i = 0;
	while ( $LPTS{$k[$i]} != $gAddr) { $i++; }
	return $k[$i];
    }

    sub setParallel { $SetPortVal->Call($gAddr, (shift)); }
    sub getStatus   { return $GetPortVal->Call($inaddr);  }
    sub getParallel { return $GetPortVal->Call($gAddr);   }

} # END BEGIN BLOCK FOR PARALLEL PORT INTERFACE


# Parallel Port Inputs (DB-25 pins 10,11,12,13)
my @octBit = ( 0x40, 0x80, 0x20, 0x10 );
# The following used by the hexstr() debugging routine
my @hexdigits = qw(0 1 2 3 4 5 6 7 8 9 A B C D E F);


my $sent = 1;

onlineMode();
while(1)
{
    my $val = getStatus();
    print "[$val] ";
    if ((!$sent) && ( $val & 0x03 ))
    {
	if ( $val & 0x01 )
	{
	    sendKeyToBrowser("x");
	    $sent = 1;
	    sleep(1);  # Could put the lockout here!
	}
	elsif ( $val & 0x02 )
	{
	    sendKeyToBrowser("y");
	    $sent = 1;
	    sleep(1);  # Could put the lockout here!
	}
    }
    if ( ! ( $val & 0x03 ) )
    {
	$sent = 0;
    }
    sleep(10);
}

