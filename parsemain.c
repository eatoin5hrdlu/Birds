#include "windows.h"
#include "stdio.h"
#include "stdlib.h"
#include "signal.h"

void loadImage(char *);
void checkImage(void);

extern int gWhere;

#define INSTALLSIGHANDLER   {int i;for(i=SIGHUP;i<NSIG;i++)signal(i,handler);}
char *signames[NSIG+2] = {
 "NO SIGNAL 0	",
 "SIGHUP	",
 "SIGINT	",
 "SIGQUIT	",
 "SIGILL	",
 "SIGTRAP	",
 "SIGABRT       ",
 "SIGEMT	",
 "SIGFPE	",
 "SIGKILL	",
 "SIGBUS	",
 "SIGSEGV	",
 "SIGSYS	",
 "SIGPIPE	",
 "SIGALRM	",
 "SIGTERM	",
 "SIGURG	",
 "SIGSTOP	",
 "SIGTSTP	",
 "SIGCONT	",
 "SIGCHLD	",
 "SIGTTIN	",
 "SIGTTOU	",
 "SIGIO	        ",
 "SIGXCPU	",
 "SIGXFSZ	",
 "SIGVTALRM     ",
 "SIGPROF	",
 "SIGWINCH      ",
 "SIGLOST       ",
 "SIGUSR1       ",
 "SIGUSR2       ",
 "SIGRTMIN      ",
 "SIGRTMAX      ",
 "NSIG	        "
};

void handler(int sig)
{

  printf("I died with signal (%s) after gWhere=%d\n", signames[sig], gWhere);
  exit(0);
}

void croplayout(char *file, int num);

int main(int argc,char **argv)
{
   /* Check arguments */
   if (argc < 2) {
      fprintf(stderr,"Usage: %s filename\n",argv[0]);
      exit(-1);
   }
   INSTALLSIGHANDLER;

   croplayout(".magnetrc",5);
   loadImage(argv[1]);
   checkImage();
   checkImages(5);
}

