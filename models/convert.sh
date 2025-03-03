#/bin/sh

for i in ./models/*.blend; do
	blender "$i" --background -noaudio -P "models/to_gltf.py"	
done
