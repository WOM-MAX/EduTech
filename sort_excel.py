import pandas as pd
import re

print("Cargando el archivo para ordenar...")
file_path = "BASES DE DATOS/planes_consolidados_master_enriquecido.xlsx"
df = pd.read_excel(file_path)

def get_curso_order(nombre):
    nombre = str(nombre).upper()
    if '1° BÁSICO' in nombre: return 1
    if '2° BÁSICO' in nombre: return 2
    if '3° BÁSICO' in nombre: return 3
    if '4° BÁSICO' in nombre: return 4
    if '5° BÁSICO' in nombre: return 5
    if '6° BÁSICO' in nombre: return 6
    if '7° BÁSICO' in nombre: return 7
    if '8° BÁSICO' in nombre: return 8
    if 'I MEDIO' in nombre: return 9
    if 'II MEDIO' in nombre: return 10
    if 'III MEDIO' in nombre or 'III Y IV' in nombre or '3 Y 4' in nombre: return 11
    if 'IV MEDIO' in nombre: return 12
    return 99

def get_oa_number(oa_str):
    oa_str = str(oa_str)
    # Extraer el primer numero que encontremos en el string
    match = re.search(r'\d+', oa_str)
    if match:
        return int(match.group())
    return 999

print("Aplicando lógica de ordenamiento...")
df['curso_order'] = df['Curso'].apply(get_curso_order)
df['oa_number'] = df['N° de OA'].apply(get_oa_number)

# Ordenar por Orden de Curso -> Asignatura alfabetico -> Numero de OA
df = df.sort_values(by=['curso_order', 'Asignatura', 'oa_number'])

# Eliminar las columnas auxiliares
df = df.drop(columns=['curso_order', 'oa_number'])

print("Guardando el archivo ordenado...")
df.to_excel(file_path, index=False)
print("¡Ordenado exitosamente!")
