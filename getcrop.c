#include <windows.h>
#include <stdio.h>
#include "line.h"

/* Global crop is min/max of each x/y */


void croplayout(char *file, int num)
{
  int i;
  gXStart = (int *)malloc(num*sizeof(int));
  gYStart = (int *)malloc(num*sizeof(int));
  gWidth  = (int *)malloc(num*sizeof(int));
  gHeight = (int *)malloc(num*sizeof(int));

  int a,b,c,d,n;
  char cropcmd[128];
  FILE *fp = fopen(file, "r");
  if (fp)
    {
      fgets(cropcmd,80,fp);
      n = sscanf(cropcmd, "%d,%d,%d,%d", &a,&b,&c,&d);
      if (n != 4 )
	{
	  printf("Failed to scan four integers on line %d of file %s\n", i+1, file);
	  exit(0);
	}
      else  /* FIRST LINE IS GLOBAL CROPPING BOX */
	{
	  tXStart = a;
	  tYStart = b;
	  tWidth = c;
	  tHeight = d;
	}

      for(i=0; i<num; i++)
	{
	  fgets(cropcmd,80,fp);
	  int n = sscanf(cropcmd, "%d,%d,%d,%d", &a,&b,&c,&d);
	  if (n != 4 )
	    {
	      printf("Failed to scan four integers on line %d of file %s\n", i+1, file);
	      exit(0);
	    }
	  else
	    {
	      gXStart[i] = a;
	      gYStart[i] = b;
	      gWidth[i]  = c;
	      gHeight[i] = d;
 //           printf("FOR %d %d %d %d %d\n",  i, gXStart[i], gYStart[i], gWidth[i], gHeight[i]);
	    }
	}
      fclose(fp);
    }
  else
    {
      printf("Could not open %s\n", file);
      exit(0);
    }
  //    printf("Global Crop is (%d,%d,%d,%d)\n", tXStart, tYStart, tWidth, tHeight);
  //    printf("Local Crop is (%d,%d,%d,%d)\n", gXStart[0], gYStart[0], gWidth[0], gHeight[0]);
}

