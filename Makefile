CC     =         gcc
#CFLAGS =	-DDEBUG -DA1
#CFLAGS =	-DDEBUG
CFLAGS =
ODIR  = 	objects
TDIR  = 	test
OBJECTS = 	${ODIR}/getcrop.o ${ODIR}/compare.o ${ODIR}/process.o ${ODIR}/parse.o ${ODIR}/paulslib.o

rb	:	readbitmap.c $(OBJECTS)
	${CC} ${CFLAGS} -o rb readbitmap.c $(OBJECTS)

clean	::
	rm -f *~ *.o ${ODIR}/*.o ${TDIR}/*.bmp

test	::
	make rb
	cd test; ./tst.sh

${ODIR}/getcrop.o	:	getcrop.c
	${CC} ${CFLAGS} -c getcrop.c
	mv getcrop.o ${ODIR}

${ODIR}/compare.o	:	compare.c
	${CC} ${CFLAGS} -c compare.c
	mv compare.o ${ODIR}

${ODIR}/process.o	:	process.c
	${CC} ${CFLAGS} -c process.c
	mv process.o ${ODIR}

cropper	:	cropper.c
	${CC} ${CFLAGS} -o cropper cropper.c
	./cropper lab.jpg
	touch cropper.c

auto	:	readbitmap.c
	${CC} ${CFLAGS} -o rb readbitmap.c
	/bin/bash -c "for i in {1..10}; do sleep 3; ./rb; done"

${ODIR}/paulslib.o	:	paulslib.c
	${CC} ${CFLAGS} -c paulslib.c
	mv paulslib.o ${ODIR}

${ODIR}/parse.o	:	parse.c
	${CC} ${CFLAGS} -c parse.c
	mv parse.o ${ODIR}

parse	: parsemain.c parse.o paulslib.o ${ODIR}/getcrop.o
	${CC} ${CFLAGS} -o parse parsemain.c parse.o paulslib.o ${ODIR}/getcrop.o
